"use client";
/**
 * Voice log flow: record (or type / sample) → extract → optional follow-up → confirm → save.
 * Nothing is stored until the user confirms. Audio exists only in memory for one upload.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard, Loader2, Volume2 } from "lucide-react";
import { ConfirmCard } from "@/components/confirm-card";
import { MicButton, formatElapsed } from "@/components/mic-button";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { MAX_RECORDING_SECONDS, isRecordingSupported, speak, stopSpeaking, useRecorder, type RecordingResult } from "@/lib/client/use-recorder";
import { MAX_FOLLOW_UPS, computeMissingFields, mergeExtractions } from "@/lib/extraction/normalize";
import { SAMPLE_MENU } from "@/lib/extraction/samples";
import type { Extraction, ExtractResponse } from "@/lib/extraction/schema";
import { speechLang, t } from "@/lib/i18n";
import type { ScoreResult } from "@/lib/scoring/engine";
import type { Language, PainEventInput } from "@/lib/types";

export type VoiceStart = { kind: "record" } | { kind: "type" } | { kind: "sample"; sampleId: string };

type Step =
  | { name: "recording" }
  | { name: "typing"; message?: string }
  | { name: "playing"; sampleId: string }
  | { name: "processing" }
  | { name: "followup"; question: string }
  | { name: "confirm" };

interface Props {
  open: boolean;
  start: VoiceStart;
  language: Language;
  /** Privacy setting: when false, audio never leaves the device; only the browser transcript is sent. */
  cloudAi?: boolean;
  onClose: () => void;
  onSaved: (score: ScoreResult) => void;
}

function toFormValues(x: Extraction, source: PainEventInput["source"]): Partial<PainEventInput> {
  return {
    occurredAt: new Date(),
    painScore: x.painScore ?? undefined,
    descriptors: x.descriptors,
    locations: x.locations,
    onsetNote: x.onsetNote,
    durationMinutes: x.durationMinutes,
    isPeriodDay: x.isPeriodDay,
    bleeding: x.bleeding,
    functionalImpact: x.functionalImpact ?? "none",
    missedActivity: x.missedActivity ?? false,
    bedBound: x.bedBound ?? false,
    associated: x.associated,
    medications: x.medications,
    redFlags: x.redFlagsMentioned,
    transcript: x.transcript,
    transcriptEn: x.transcriptEn,
    languageDetected: x.languageDetected,
    source,
    confidence: x.confidence,
  };
}

export function VoiceLogSheet({ open, start, language, cloudAi = true, onClose, onSaved }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "processing" });
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [source, setSource] = useState<PainEventInput["source"]>("voice");
  const [followUps, setFollowUps] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const lang = speechLang(language);

  // Refs so async callbacks see the latest follow-up state.
  const pendingQuestion = useRef<string | null>(null);
  const baseExtraction = useRef<Extraction | null>(null);
  const followUpsRef = useRef(0);

  const goTyping = useCallback((message?: string) => setStep({ name: "typing", message }), []);

  /** Apply a server response (first note or follow-up answer). */
  const applyResponse = useCallback(
    (res: ExtractResponse) => {
      const isAnswer = pendingQuestion.current !== null && baseExtraction.current !== null;
      const merged = isAnswer && baseExtraction.current ? mergeExtractions(baseExtraction.current, res.extracted) : res.extracted;
      const count = isAnswer ? followUpsRef.current + 1 : followUpsRef.current;
      followUpsRef.current = count;
      setFollowUps(count);
      pendingQuestion.current = null;
      baseExtraction.current = merged;
      setResult(res);
      setExtraction(merged);
      if (merged.painScore === null && count < MAX_FOLLOW_UPS && res.followUpQuestion) {
        pendingQuestion.current = res.followUpQuestion;
        setStep({ name: "followup", question: res.followUpQuestion });
        speak(res.followUpQuestion, lang);
      } else {
        setFormKey((k) => k + 1);
        setStep({ name: "confirm" });
      }
    },
    [lang],
  );

  const sendJson = useCallback(
    async (body: { text?: string; sampleId?: string }) => {
      setStep({ name: "processing" });
      try {
        const res = await apiFetch<ExtractResponse>("/api/voice/extract", {
          method: "POST",
          json: {
            ...body,
            language,
            followUpCount: followUpsRef.current + (pendingQuestion.current ? 1 : 0),
            followUpQuestion: pendingQuestion.current ?? undefined,
          },
        });
        applyResponse(res);
      } catch (err) {
        goTyping(`${errorMessage(err)} You can type your note instead.`);
      }
    },
    [applyResponse, goTyping, language],
  );

  const sendAudio = useCallback(
    async (rec: RecordingResult) => {
      if (!cloudAi) {
        // On-device speech recognition only: send the transcript text, never the audio.
        if (rec.browserTranscript) {
          setTyped(rec.browserTranscript);
          void sendJson({ text: rec.browserTranscript });
        } else {
          goTyping("Cloud AI is off in your privacy settings and this browser couldn't transcribe on its own. Please type your note.");
        }
        return;
      }
      setStep({ name: "processing" });
      const fd = new FormData();
      const ext = rec.mimeType.includes("mp4") ? "mp4" : rec.mimeType.includes("ogg") ? "ogg" : "webm";
      fd.append("audio", rec.blob, `note.${ext}`);
      fd.append("language", language);
      fd.append("followUpCount", String(followUpsRef.current + (pendingQuestion.current ? 1 : 0)));
      if (pendingQuestion.current) fd.append("followUpQuestion", pendingQuestion.current);
      if (rec.browserTranscript) fd.append("browserTranscript", rec.browserTranscript);
      try {
        const res = await apiFetch<ExtractResponse>("/api/voice/extract", { method: "POST", body: fd });
        applyResponse(res);
      } catch (err) {
        if (rec.browserTranscript) setTyped(rec.browserTranscript);
        goTyping(`${errorMessage(err)} Your words are below if we caught them; edit and send.`);
      }
      // The Blob is dropped here; nothing keeps a reference to the audio.
    },
    [applyResponse, goTyping, language, cloudAi, sendJson],
  );

  const recorder = useRecorder(sendAudio, lang);

  // Reset and begin when the sheet opens.
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setExtraction(null);
    setTyped("");
    setFollowUps(0);
    followUpsRef.current = 0;
    pendingQuestion.current = null;
    baseExtraction.current = null;
    if (start.kind === "sample") {
      setSource("sample");
      setStep({ name: "playing", sampleId: start.sampleId });
    } else if (start.kind === "type" || !isRecordingSupported()) {
      setSource("text");
      goTyping(start.kind === "record" ? "Voice recording isn't available here, so please type your note." : undefined);
    } else {
      setSource("voice");
      setStep({ name: "recording" });
      void recorder.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sample "playback": read the transcript aloud (if supported), then run it through extraction.
  useEffect(() => {
    if (step.name !== "playing") return;
    const sample = SAMPLE_MENU.find((s) => s.id === step.sampleId);
    if (!sample) return;
    const sampleLang = sample.language === "hi" || sample.language === "mixed" ? "hi-IN" : sample.language === "ml" ? "ml-IN" : "en-IN";
    speak(sample.transcript, sampleLang);
    const timer = setTimeout(() => void sendJson({ sampleId: sample.id }), 2200);
    return () => clearTimeout(timer);
  }, [step, sendJson]);

  useEffect(() => {
    if (recorder.error) goTyping(recorder.error);
  }, [recorder.error, goTyping]);

  const close = () => {
    stopSpeaking();
    if (recorder.state !== "idle") recorder.cancel();
    onClose();
  };

  const reRecord = () => {
    followUpsRef.current = 0;
    setFollowUps(0);
    pendingQuestion.current = null;
    baseExtraction.current = null;
    if (source === "text" || !isRecordingSupported()) {
      goTyping();
      return;
    }
    setSource("voice");
    setStep({ name: "recording" });
    void recorder.start();
  };

  const answerWithNumber = (n: number) => {
    if (!baseExtraction.current || !result) return;
    stopSpeaking();
    const merged: Extraction = { ...baseExtraction.current, painScore: n };
    baseExtraction.current = merged;
    pendingQuestion.current = null;
    setExtraction(merged);
    setFormKey((k) => k + 1);
    setStep({ name: "confirm" });
  };

  const handleSaved = (score: ScoreResult) => {
    onSaved(score);
    if (score.level === "URGENT") router.push("/urgent");
    else onClose();
  };

  const title =
    step.name === "confirm" ? "Check and confirm" : step.name === "followup" ? "One quick question" : step.name === "typing" ? "Type your note" : "Log pain";

  return (
    <Sheet open={open} onClose={close} title={title}>
      {step.name === "recording" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <MicButton recording={recorder.state === "recording"} onClick={recorder.stop} label="Stop recording" disabled={recorder.state === "stopping"} />
          <p className="text-2xl font-semibold tabular-nums text-sand-800" aria-live="polite">
            {formatElapsed(recorder.elapsed)} <span className="text-base font-normal text-sand-600">/ {formatElapsed(MAX_RECORDING_SECONDS)}</span>
          </p>
          <p className="text-sand-600">{pendingQuestion.current ?? t("listening", language)}</p>
          <p className="max-w-xs text-sm text-sand-600">{t("speakHint", language)}</p>
          <Button variant="ghost" onClick={() => { recorder.cancel(); goTyping(); }}>
            <Keyboard /> {t("typeInstead", language)}
          </Button>
        </div>
      )}

      {step.name === "playing" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Volume2 className="h-10 w-10 animate-pulse text-plum-600" aria-hidden />
          <p className="text-sm font-semibold text-sand-600">Playing sample voice note (sample data)</p>
          <p className="rounded-md bg-plum-50 p-3 text-plum-800">“{SAMPLE_MENU.find((s) => s.id === step.sampleId)?.transcript}”</p>
        </div>
      )}

      {step.name === "processing" && (
        <div role="status" className="flex flex-col items-center gap-3 py-10 text-sand-600">
          <Loader2 className="h-8 w-8 animate-spin text-plum-600" aria-hidden />
          <p>Understanding your note…</p>
          <p className="text-xs">Audio is processed in memory and never stored.</p>
        </div>
      )}

      {step.name === "typing" && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) {
              setSource("text");
              void sendJson({ text: typed.trim() });
            }
          }}
        >
          {step.message && <p role="alert" className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">{step.message}</p>}
          <label htmlFor="typed-note" className="text-sm text-sand-600">
            Describe the pain in English, Hindi or Malayalam. {t("speakHint", language)}
          </label>
          <Textarea id="typed-note" value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={2000} autoFocus />
          <Button type="submit" disabled={!typed.trim()}>
            Continue
          </Button>
        </form>
      )}

      {step.name === "followup" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-md bg-plum-50 p-3">
            <p className="flex-1 text-lg font-semibold text-plum-800">{step.question}</p>
            <Button variant="ghost" size="icon" aria-label="Read the question aloud" onClick={() => speak(step.question, lang)}>
              <Volume2 />
            </Button>
          </div>
          <div role="group" aria-label="Choose a number" className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 11 }, (_, n) => (
              <Button key={n} variant="outline" className="text-base" onClick={() => answerWithNumber(n)}>
                {n}
              </Button>
            ))}
          </div>
          {isRecordingSupported() && (
            <Button
              variant="secondary"
              onClick={() => {
                setStep({ name: "recording" });
                void recorder.start();
              }}
            >
              Answer by voice
            </Button>
          )}
          <Button variant="ghost" onClick={() => { pendingQuestion.current = null; setFormKey((k) => k + 1); setStep({ name: "confirm" }); }}>
            Skip, I&apos;ll fill it in
          </Button>
          <p className="text-xs text-sand-600">Question {followUps + 1} of {MAX_FOLLOW_UPS} at most.</p>
        </div>
      )}

      {step.name === "confirm" && extraction && (
        <ConfirmCard
          key={formKey}
          mode="create"
          initial={toFormValues(extraction, source)}
          missingFields={computeMissingFields(extraction)}
          confidence={extraction.confidence}
          notice={result?.notice ?? null}
          onReRecord={reRecord}
          onSaved={handleSaved}
        />
      )}
    </Sheet>
  );
}
