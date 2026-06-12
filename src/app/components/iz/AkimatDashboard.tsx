import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useI18n } from "./i18n";
import { Activity, MapPin, Users, RefreshCw, X } from "./Icons";

/**
 * Akimat tourism analytics — anonymous, aggregated view of how Iz is being
 * used across Mangystau. Designed to be handed to akimat (local-government)
 * staff so they can spot which sights are pulling visitors, on which days,
 * and at which hours. No PII; pure roll-ups from /api/analytics.
 */

type SightCount = { label: string; count: number };
type DayCount = { day: string; count: number };
type HourCount = { hour: number; count: number };

type AnalyticsResponse = {
  totalSnapshots: number;
  uniqueExplorers: number;
  last7Days: number;
  last30Days: number;
  bySight: SightCount[];
  byDay: DayCount[];
  byHour: HourCount[];
  generatedAt: string;
  sampleWindow: "full" | "capped_5000";
};

type Props = { onClose: () => void };

const ease = [0.16, 1, 0.3, 1] as const;

function fmtDay(iso: string) {
  // "2026-06-12" -> "06-12"
  return iso.slice(5);
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function AkimatDashboard({ onClose }: Props) {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/analytics");
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as AnalyticsResponse;
      setData(j);
    } catch (e: any) {
      setErr(e?.message ?? "load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sightMax = useMemo(
    () => (data ? Math.max(1, ...data.bySight.map((s) => s.count)) : 1),
    [data],
  );
  const dayMax = useMemo(
    () => (data ? Math.max(1, ...data.byDay.map((d) => d.count)) : 1),
    [data],
  );
  const hourMax = useMemo(
    () => (data ? Math.max(1, ...data.byHour.map((h) => h.count)) : 1),
    [data],
  );
  const busiestHour = useMemo(() => {
    if (!data) return null;
    let best: HourCount | null = null;
    for (const h of data.byHour) {
      if (!best || h.count > best.count) best = h;
    }
    return best && best.count > 0 ? best : null;
  }, [data]);

  const empty = !!data && data.totalSnapshots === 0;

  return (
    <motion.div
      key="akimat-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="absolute inset-0 z-40 flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,30,52,0.78) 0%, rgba(8,30,52,0.62) 50%, rgba(8,30,52,0.86) 100%)",
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-12 pb-2">
        <div className="min-w-0 pr-3">
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
            }}
          >
            {t("akimat_kicker")}
          </p>
          <p
            className="font-display"
            style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}
          >
            {t("akimat_title")}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.66)", marginTop: 4 }}>
            {t("akimat_subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            aria-label={t("akimat_refresh")}
            title={t("akimat_refresh")}
            className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff",
            }}
          >
            <motion.span
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { repeat: Infinity, duration: 0.9, ease: "linear" } : { duration: 0.2 }}
              style={{ display: "inline-flex" }}
            >
              <RefreshCw size={16} strokeWidth={2.2} />
            </motion.span>
          </button>
          <button
            onClick={onClose}
            aria-label={t("akimat_close")}
            title={t("akimat_close")}
            className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff",
            }}
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4">
        {err && (
          <div
            className="mb-4 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(255,90,90,0.14)",
              border: "1px solid rgba(255,90,90,0.36)",
              color: "#ffd1d1",
              fontSize: 13,
            }}
          >
            {t("akimat_load_error")}
          </div>
        )}

        {!data && loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
        )}

        {data && empty && (
          <div
            className="rounded-2xl px-4 py-5"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.78)",
              fontSize: 13,
            }}
          >
            {t("akimat_no_data")}
          </div>
        )}

        {data && !empty && (
          <div className="space-y-5">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={<Activity size={16} strokeWidth={2.2} />}
                label={t("akimat_total")}
                value={data.totalSnapshots}
                delay={0}
              />
              <StatTile
                icon={<Users size={16} strokeWidth={2.2} />}
                label={t("akimat_explorers")}
                value={data.uniqueExplorers}
                delay={0.04}
              />
              <StatTile
                icon={<MapPin size={16} strokeWidth={2.2} />}
                label={t("akimat_last7")}
                value={data.last7Days}
                delay={0.08}
              />
              <StatTile
                icon={<MapPin size={16} strokeWidth={2.2} />}
                label={t("akimat_last30")}
                value={data.last30Days}
                delay={0.12}
              />
            </div>

            {/* Top sights */}
            <Section title={t("akimat_top_sights")}>
              <div className="space-y-2.5">
                {data.bySight.map((s, i) => (
                  <motion.div
                    key={s.label + i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.4, ease }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="min-w-0 flex-1 truncate"
                      style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}
                    >
                      {s.label}
                    </div>
                    <div
                      className="relative h-2 flex-[2] overflow-hidden rounded-full"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / sightMax) * 100}%` }}
                        transition={{ delay: 0.06 * i, duration: 0.6, ease }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, var(--iz-accent), rgba(46,230,201,0.55))",
                          boxShadow: "0 0 18px rgba(46,230,201,0.35)",
                        }}
                      />
                    </div>
                    <div
                      className="shrink-0 tabular-nums"
                      style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", width: 32, textAlign: "right" }}
                    >
                      {s.count}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Section>

            {/* By day */}
            <Section title={t("akimat_by_day")}>
              <div className="flex h-28 items-end gap-1">
                {data.byDay.map((d, i) => {
                  const h = Math.max(2, (d.count / dayMax) * 100);
                  return (
                    <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      <motion.span
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.02 * i, duration: 0.55, ease }}
                        className="w-full rounded-t-md"
                        style={{
                          background:
                            "linear-gradient(180deg, var(--iz-accent), rgba(46,230,201,0.35))",
                          boxShadow: "0 0 14px rgba(46,230,201,0.22)",
                          minHeight: 3,
                        }}
                        title={`${d.day} · ${d.count}`}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.55)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {fmtDay(d.day)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* By hour */}
            <Section
              title={t("akimat_by_hour")}
              hint={
                busiestHour
                  ? `${t("akimat_busiest_hour")}: ${String(busiestHour.hour).padStart(2, "0")}:00`
                  : undefined
              }
            >
              <div className="flex h-24 items-end gap-[3px]">
                {data.byHour.map((b, i) => {
                  const h = Math.max(2, (b.count / hourMax) * 100);
                  const isBest = busiestHour ? b.hour === busiestHour.hour : false;
                  return (
                    <div key={b.hour} className="flex h-full flex-1 flex-col items-end justify-end">
                      <motion.span
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.015 * i, duration: 0.5, ease }}
                        className="w-full rounded-t-sm"
                        style={{
                          background: isBest
                            ? "linear-gradient(180deg, #fff, var(--iz-accent))"
                            : "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(46,230,201,0.3))",
                          boxShadow: isBest ? "0 0 16px rgba(46,230,201,0.55)" : undefined,
                          minHeight: 2,
                        }}
                        title={`${String(b.hour).padStart(2, "0")}:00 · ${b.count}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                <span>00</span>
                <span>06</span>
                <span>12</span>
                <span>18</span>
                <span>23</span>
              </div>
            </Section>

            <p
              className="pt-2 text-center"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}
            >
              {t("akimat_updated")} · {fmtTime(data.generatedAt)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatTile({
  icon,
  label,
  value,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease }}
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.72)" }}>
        {icon}
        <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <p
        className="tabular-nums"
        style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.05, marginTop: 6 }}
      >
        {value.toLocaleString()}
      </p>
    </motion.div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
          }}
        >
          {title}
        </p>
        {hint && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SkeletonStat() {
  return (
    <div
      className="h-20 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    />
  );
}
