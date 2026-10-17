"use client";
import { useQuery } from "@tanstack/react-query";
import type { ScoreResult } from "@/lib/scoring/engine";
import type { Report } from "@/lib/report-service";
import type { CycleEstimate } from "@/lib/cycles";
import type { PatternResult } from "@/lib/patterns/engine";
import type { AppointmentDTO, DailyLogDTO, DoctorDTO } from "@/lib/dto";
import type { ReminderItem } from "@/lib/health-service";
import type { MeDTO, OrderDTO, PainEventDTO, PeriodDTO, ProductDTO } from "@/lib/types";
import { apiFetch } from "./api";

export const qk = {
  me: ["me"] as const,
  score: ["score"] as const,
  events: (from?: string, to?: string) => ["events", from ?? "", to ?? ""] as const,
  periods: ["periods"] as const,
  summary: (days: number) => ["summary", days] as const,
  products: (q: string, category: string) => ["products", q, category] as const,
  orders: ["orders"] as const,
  reminder: ["reminder"] as const,
  dailyLogs: (from?: string, to?: string) => ["dailyLogs", from ?? "", to ?? ""] as const,
  cycle: ["cycle"] as const,
  patterns: ["patterns"] as const,
  tips: ["tips"] as const,
  recs: ["recs"] as const,
  doctors: (params: string) => ["doctors", params] as const,
  doctor: (id: string) => ["doctor", id] as const,
  appointments: ["appointments"] as const,
  shareLinks: ["shareLinks"] as const,
  reminders: ["reminders"] as const,
};

/** Keys to refresh after any change to health data. */
export const HEALTH_KEYS = [["score"], ["events"], ["periods"], ["summary"], ["dailyLogs"], ["cycle"], ["patterns"], ["tips"], ["recs"], ["reminders"]] as const;

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: () => apiFetch<{ user: MeDTO }>("/api/auth/me").then((r) => r.user) });
}

export function useScore() {
  return useQuery({ queryKey: qk.score, queryFn: () => apiFetch<{ score: ScoreResult }>("/api/score").then((r) => r.score) });
}

export function useEvents(from?: Date, to?: Date) {
  const f = from?.toISOString();
  const t = to?.toISOString();
  return useQuery({
    queryKey: qk.events(f, t),
    queryFn: () => {
      const p = new URLSearchParams();
      if (f) p.set("from", f);
      if (t) p.set("to", t);
      return apiFetch<{ events: PainEventDTO[] }>(`/api/pain-events?${p.toString()}`).then((r) => r.events);
    },
  });
}

export interface PeriodsResponse {
  periods: PeriodDTO[];
  averageCycleLength: number | null;
  nextPeriod: { date: string; daysUntil: number; cycleLength: number } | null;
}

export function usePeriods() {
  return useQuery({ queryKey: qk.periods, queryFn: () => apiFetch<PeriodsResponse>("/api/periods") });
}

export function useSummary(days: number) {
  return useQuery({
    queryKey: qk.summary(days),
    queryFn: () => apiFetch<{ report: Report }>(`/api/summary?days=${days}`).then((r) => r.report),
  });
}

export function useDailyLogs(from?: string, to?: string) {
  return useQuery({
    queryKey: qk.dailyLogs(from, to),
    queryFn: () => {
      const p = new URLSearchParams();
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      return apiFetch<{ logs: DailyLogDTO[] }>(`/api/daily-logs?${p.toString()}`).then((r) => r.logs);
    },
  });
}

export interface CycleResponse {
  estimate: CycleEstimate;
  shading: { predictedPeriod: string[]; fertile: string[]; loggedPeriod: string[] };
}

export function useCycle() {
  return useQuery({ queryKey: qk.cycle, queryFn: () => apiFetch<CycleResponse>("/api/cycle") });
}

export function usePatterns() {
  return useQuery({ queryKey: qk.patterns, queryFn: () => apiFetch<{ result: PatternResult }>("/api/patterns").then((r) => r.result) });
}

export function useTips() {
  return useQuery({ queryKey: qk.tips, queryFn: () => apiFetch<{ tips: { slug: string; title: string; summary: string; because: string[] }[] }>("/api/tips").then((r) => r.tips) });
}

export function useRecommendations() {
  return useQuery({
    queryKey: qk.recs,
    queryFn: () => apiFetch<{ enabled: boolean; items: { product: ProductDTO; reasons: string[] }[] }>("/api/recommendations"),
  });
}

export function useDoctors(params: string) {
  return useQuery({ queryKey: qk.doctors(params), queryFn: () => apiFetch<{ doctors: DoctorDTO[] }>(`/api/doctors?${params}`).then((r) => r.doctors) });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: qk.doctor(id),
    queryFn: () => apiFetch<{ doctor: DoctorDTO; slots: string[]; platformFeeInr: number; cancelPolicy: string }>(`/api/doctors/${encodeURIComponent(id)}`),
  });
}

export function useAppointments() {
  return useQuery({ queryKey: qk.appointments, queryFn: () => apiFetch<{ appointments: AppointmentDTO[] }>("/api/appointments").then((r) => r.appointments) });
}

export interface ShareLinkDTO {
  id: string;
  label: string;
  days: number;
  expiresAt: string;
  revoked: boolean;
  views: number;
  createdAt: string;
}

export function useShareLinks() {
  return useQuery({ queryKey: qk.shareLinks, queryFn: () => apiFetch<{ links: ShareLinkDTO[] }>("/api/share-links").then((r) => r.links) });
}

export function useReminders() {
  return useQuery({ queryKey: qk.reminders, queryFn: () => apiFetch<{ reminders: ReminderItem[] }>("/api/reminders").then((r) => r.reminders) });
}

export function useProducts(q: string, category: string) {
  return useQuery({
    queryKey: qk.products(q, category),
    queryFn: () => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (category) p.set("category", category);
      return apiFetch<{ products: ProductDTO[] }>(`/api/products?${p.toString()}`).then((r) => r.products);
    },
  });
}

export function useOrders() {
  return useQuery({ queryKey: qk.orders, queryFn: () => apiFetch<{ orders: OrderDTO[] }>("/api/orders").then((r) => r.orders) });
}

export type ReminderResponse = { show: false } | { show: true; nextPeriodDate: string; daysUntil: number };

export function useReminder() {
  return useQuery({ queryKey: qk.reminder, queryFn: () => apiFetch<ReminderResponse>("/api/shop/reminder") });
}
