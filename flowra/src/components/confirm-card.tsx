"use client";
/**
 * CONFIRM card: every extracted field is an editable control. Missing or
 * low-confidence fields are highlighted. NOTHING is saved until "Confirm & save".
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertTriangle, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch, ApiError, errorMessage } from "@/lib/client/api";
import { HEALTH_KEYS } from "@/lib/client/hooks";
import type { ExtractableField } from "@/lib/extraction/schema";
import { LOW_CONFIDENCE } from "@/lib/extraction/normalize";
import type { ScoreResult } from "@/lib/scoring/engine";
import {
  ASSOCIATED,
  BLEEDING,
  DESCRIPTORS,
  IMPACTS,
  LABELS,
  LOCATIONS,
  PainEventInputSchema,
  RED_FLAG_CODES,
  RED_FLAG_LABELS,
  RELIEF,
  type PainEventInput,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConfirmCardProps {
  initial: Partial<PainEventInput>;
  missingFields?: ExtractableField[];
  confidence?: number;
  notice?: string | null;
  mode: "create" | "edit";
  eventId?: string;
  onReRecord?: () => void;
  onSaved: (score: ScoreResult) => void;
  onCancel?: () => void;
}

function Section({ label, highlight, children, hint }: { label: string; highlight?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <fieldset className={cn("rounded-md border p-3", highlight ? "border-amber-400 bg-amber-50/60" : "border-sand-200 bg-white")}>
      <legend className="px-1 text-sm font-semibold text-sand-800">
        {label}
        {highlight && <span className="ml-2 text-xs font-medium text-amber-900">Not mentioned, please check</span>}
      </legend>
      {hint && <p className="mb-2 text-xs text-sand-600">{hint}</p>}
      {children}
    </fieldset>
  );
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function toLocalInput(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function ConfirmCard({ initial, missingFields = [], confidence = 1, notice, mode, eventId, onReRecord, onSaved, onCancel }: ConfirmCardProps) {
  const qc = useQueryClient();
  const miss = (f: ExtractableField) => missingFields.includes(f);

  const form = useForm<PainEventInput>({
    resolver: zodResolver(PainEventInputSchema),
    defaultValues: {
      occurredAt: new Date(),
      descriptors: [],
      locations: [],
      onsetNote: null,
      durationMinutes: null,
      isPeriodDay: null,
      bleeding: null,
      functionalImpact: "none",
      missedActivity: false,
      bedBound: false,
      associated: [],
      medications: [],
      redFlags: [],
      transcript: "",
      transcriptEn: "",
      languageDetected: "en",
      source: "text",
      confidence: 1,
      ...initial,
    },
  });
  const { control, handleSubmit, formState, watch } = form;
  const meds = useFieldArray({ control, name: "medications" });

  const save = useMutation({
    mutationFn: (values: PainEventInput) =>
      mode === "edit" && eventId
        ? apiFetch<{ score: ScoreResult }>("/api/pain-events", { method: "PATCH", json: { ...values, id: eventId } })
        : apiFetch<{ score: ScoreResult }>("/api/pain-events", { method: "POST", json: values }),
    onSuccess: async (res) => {
      await Promise.all(HEALTH_KEYS.map((key) => qc.invalidateQueries({ queryKey: [...key] })));
      onSaved(res.score);
    },
  });

  const transcript = watch("transcript");
  const transcriptEn = watch("transcriptEn");
  const lowConfidence = confidence < LOW_CONFIDENCE;

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} className="flex flex-col gap-3" noValidate>
      {transcript && (
        <div className="rounded-md bg-plum-50 p-3 text-sm">
          <p className="font-medium text-plum-800">“{transcript}”</p>
          {transcriptEn && transcriptEn !== transcript && <p className="mt-1 text-plum-700">English: {transcriptEn}</p>}
        </div>
      )}
      {notice && <p className="rounded-md bg-teal-50 p-2 text-xs text-teal-700">{notice}</p>}
      {lowConfidence && (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900" role="note">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> We weren&apos;t fully sure about this note. Please check every field.
        </p>
      )}

      <Section label="Pain right now (0–10)" highlight={miss("painScore")}>
        <Controller
          control={control}
          name="painScore"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Pain score" className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={field.value === n}
                  onClick={() => field.onChange(n)}
                  className={cn(
                    "h-11 rounded-md border text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
                    field.value === n ? "border-plum-600 bg-plum-600 text-white" : "border-sand-200 bg-white text-sand-800",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        />
        {formState.errors.painScore && <p className="mt-1 text-sm text-red-700">Please choose a number from 0 to 10.</p>}
      </Section>

      <Section label="When">
        <Controller
          control={control}
          name="occurredAt"
          render={({ field }) => (
            <Input
              type="datetime-local"
              aria-label="When did it happen"
              value={field.value instanceof Date && !Number.isNaN(field.value.getTime()) ? toLocalInput(field.value) : ""}
              max={toLocalInput(new Date())}
              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
            />
          )}
        />
      </Section>

      <Section label="What it feels like" highlight={miss("descriptors")}>
        <Controller
          control={control}
          name="descriptors"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {DESCRIPTORS.map((d) => (
                <Chip key={d} selected={field.value.includes(d)} onClick={() => field.onChange(toggle(field.value, d))}>
                  {LABELS.descriptors[d]}
                </Chip>
              ))}
            </div>
          )}
        />
      </Section>

      <Section label="Where" highlight={miss("locations")}>
        <Controller
          control={control}
          name="locations"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((l) => (
                <Chip key={l} selected={field.value.includes(l)} onClick={() => field.onChange(toggle(field.value, l))}>
                  {LABELS.locations[l]}
                </Chip>
              ))}
            </div>
          )}
        />
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section label="Period day?" highlight={miss("isPeriodDay")}>
          <Controller
            control={control}
            name="isPeriodDay"
            render={({ field }) => (
              <Select
                aria-label="Is it a period day"
                value={field.value === null ? "" : field.value ? "yes" : "no"}
                onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value === "yes")}
              >
                <option value="">Not sure</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            )}
          />
        </Section>
        <Section label="Bleeding" highlight={miss("bleeding")}>
          <Controller
            control={control}
            name="bleeding"
            render={({ field }) => (
              <Select aria-label="Bleeding" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}>
                <option value="">Not said</option>
                {BLEEDING.map((b) => (
                  <option key={b} value={b}>
                    {LABELS.bleeding[b]}
                  </option>
                ))}
              </Select>
            )}
          />
        </Section>
      </div>

      <Section label="How long (minutes)" highlight={miss("durationMinutes")}>
        <Controller
          control={control}
          name="durationMinutes"
          render={({ field }) => (
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label="Duration in minutes"
              placeholder="e.g. 90"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))))}
            />
          )}
        />
      </Section>

      <Section label="Effect on your day" highlight={miss("functionalImpact")}>
        <Controller
          control={control}
          name="functionalImpact"
          render={({ field }) => (
            <div className="flex gap-2">
              {IMPACTS.map((i) => (
                <Chip key={i} selected={field.value === i} onClick={() => field.onChange(i)}>
                  {LABELS.impacts[i]}
                </Chip>
              ))}
            </div>
          )}
        />
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <Controller
            control={control}
            name="missedActivity"
            render={({ field }) => (
              <label className="flex min-h-10 items-center gap-3">
                <input type="checkbox" className="h-5 w-5 accent-plum-600" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                Missed college, work or plans
              </label>
            )}
          />
          <Controller
            control={control}
            name="bedBound"
            render={({ field }) => (
              <label className="flex min-h-10 items-center gap-3">
                <input type="checkbox" className="h-5 w-5 accent-plum-600" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                Had to stay in bed
              </label>
            )}
          />
        </div>
      </Section>

      <Section label="Other symptoms">
        <Controller
          control={control}
          name="associated"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {ASSOCIATED.map((a) => (
                <Chip key={a} selected={field.value.includes(a)} onClick={() => field.onChange(toggle(field.value, a))}>
                  {LABELS.associated[a]}
                </Chip>
              ))}
            </div>
          )}
        />
      </Section>

      <Section label="Medicine taken">
        <div className="flex flex-col gap-2">
          {meds.fields.length === 0 && <p className="text-sm text-sand-600">None logged.</p>}
          {meds.fields.map((m, idx) => (
            <div key={m.id} className="flex gap-2">
              <Controller
                control={control}
                name={`medications.${idx}.name`}
                render={({ field }) => <Input aria-label="Medicine name" placeholder="Name" className="flex-1" {...field} />}
              />
              <Controller
                control={control}
                name={`medications.${idx}.relief`}
                render={({ field }) => (
                  <Select aria-label="Relief" className="w-32" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                    {RELIEF.map((r) => (
                      <option key={r} value={r}>
                        {LABELS.relief[r]}
                      </option>
                    ))}
                  </Select>
                )}
              />
              <Button variant="ghost" size="icon" aria-label="Remove medicine" onClick={() => meds.remove(idx)}>
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="self-start" onClick={() => meds.append({ name: "", relief: "unknown" })}>
            <Plus /> Add medicine
          </Button>
          {formState.errors.medications && <p className="text-sm text-red-700">Please enter a name for each medicine or remove it.</p>}
        </div>
      </Section>

      <Section label="Danger signs" hint="Tick any that apply. These show urgent-care advice straight away.">
        <Controller
          control={control}
          name="redFlags"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {RED_FLAG_CODES.map((c) => (
                <Chip key={c} tone="danger" selected={field.value.includes(c)} onClick={() => field.onChange(toggle(field.value, c))}>
                  {RED_FLAG_LABELS[c]}
                </Chip>
              ))}
            </div>
          )}
        />
      </Section>

      {save.isError && (
        <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">
          {save.error instanceof ApiError && save.error.issues?.length
            ? `Please check: ${save.error.issues.map((i) => i.path).join(", ")}`
            : errorMessage(save.error)}
        </p>
      )}
      {Object.keys(formState.errors).length > 0 && !save.isError && (
        <p role="alert" className="text-sm text-red-700">Some fields need attention (highlighted above).</p>
      )}

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-sand-200 bg-sand-50 px-4 py-3">
        {onReRecord && (
          <Button variant="outline" onClick={onReRecord} disabled={save.isPending}>
            <RotateCcw /> Re-record
          </Button>
        )}
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={save.isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" /> : null}
          {mode === "edit" ? "Save changes" : "Confirm & save"}
        </Button>
      </div>
    </form>
  );
}
