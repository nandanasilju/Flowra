"use client";
/**
 * Microphone recorder (MediaRecorder) with a live timer and a hard 60 s cap.
 * In parallel it runs the Web Speech API (where available) to get a fallback
 * transcript in case the AI service is unavailable.
 * Audio stays in memory as a Blob; it is uploaded once for extraction and never stored.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_RECORDING_SECONDS = 60;

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  browserTranscript: string;
}

type RecorderState = "idle" | "recording" | "stopping";

// Minimal Web Speech API typings (not in the TS DOM lib).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function isRecordingSupported(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function useRecorder(onComplete: (r: RecordingResult) => void, speechLang: string) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      setState("stopping");
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      rec.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
    cleanup();
    setState("idle");
    setElapsed(0);
  }, [stop, cleanup]);

  const start = useCallback(async () => {
    setError(null);
    if (!isRecordingSupported()) {
      setError("Voice recording isn't supported in this browser. Please type instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      transcriptRef.current = "";
      cancelledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        const transcript = transcriptRef.current.trim();
        cleanup();
        setState("idle");
        if (!cancelledRef.current && blob.size > 0) onCompleteRef.current({ blob, mimeType: type, browserTranscript: transcript });
      };
      recorder.start(250);

      // Optional parallel transcript via Web Speech API (best effort).
      const SR = getSpeechRecognition();
      if (SR) {
        try {
          const recognition = new SR();
          recognition.lang = speechLang;
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.onresult = (e) => {
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const r = e.results[i];
              if (r.isFinal) transcriptRef.current += `${r[0].transcript} `;
            }
          };
          recognition.onerror = () => undefined;
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          recognitionRef.current = null;
        }
      }

      const startedAt = Date.now();
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startedAt) / 1000);
        setElapsed(s);
        if (s >= MAX_RECORDING_SECONDS) stop();
      }, 250);
    } catch {
      cleanup();
      setState("idle");
      setError("We couldn't access the microphone. Please allow mic access, or type instead.");
    }
  }, [cleanup, speechLang, stop]);

  useEffect(() => () => {
    cancelledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    cleanup();
  }, [cleanup]);

  return { state, elapsed, error, start, stop, cancel, setError };
}

/** Speak a short prompt (optional voice-out). Silently does nothing if unsupported. */
export function speak(text: string, lang: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
