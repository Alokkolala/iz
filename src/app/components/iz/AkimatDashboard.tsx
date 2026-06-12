import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useI18n } from "./i18n";
import { Activity, MapPin, Users, RefreshCw, X, Sun, Footprints } from "./Icons";

/**
 * Akimat tourism analytics — anonymous, aggregated view of how Iz is being
 * used across Mangystau. Designed to be handed to akimat (local-government)
 * staff so they can spot which sights are pulling visitors, on which days,
 * and at which hours. No PII; pure roll-ups from /api/analytics.
 *
 * The dashboard always shows the full chart structure — even with zero data
 * we render empty bars so the akimat audience can see what the page will
 * eventually contain. A soft banner explains the empty state in-line.
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

  const peakDay = useMemo(() => {
    if (!data) return null;
    let best: DayCount | null = null;
    for (const d of data.byDay) {
      if (!best || d.count > best.count) best = d;
    }
    return best && best.count > 0 ? best : null;
  }, [data]);

  const activeDays = useMemo(() => {
    if (!data) return 0;
    return data.byDay.reduce((acc, d) => acc + (d.count > 0 ? 1 : 0), 0);
  }, [data]);

  const avgPerDay = useMemo(() => {
    if (!data || data.byDay.length === 0) return 0;
    const sum = data.byDay.reduce((a, b) => a + b.count, 0);
    return sum / data.byDay.length;
  }, [data]);

  const topSharePct = useMemo(() => {
    if (!data || data.totalSnapshots === 0 || data.bySight.length === 0) return 0;
    return Math.round((data.bySight[0].count / data.totalSnapshots) * 100);
  }, [data]);

  // Always show 14 day-slots and 24 hour-slots so the chart skeleton is
  // present even before the API responds.
  const dayCells: DayCount[] = useMemo(() => {
    if (data) return data.byDay;
    const out: DayCount[] = [];
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      out.push({ day: d.toISOString().slice(0, 10), count: 0 });
    }
    return out;
  }, [data]);

  const hourCells: HourCount[] = useMemo(() => {
    if (data) return data.byHour;
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  }, [data]);

  const isEmpty = !!data && data.totalSnapshots === 0;

  return (
    <motion.div
      key="akimat-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{
        // Solid base so nothing behind the overlay bleeds through.
        background:
          "radial-gradient(120% 80% at 50% 0%, #0d3a64 0%, #07223d 55%, #04162a 100%)",
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
      <div className="flex-1 overflow-y-auto px-5 pb-10 pt-4">
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

        {isEmpty && (
          <div
            className="mb-4 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(46,230,201,0.10)",
              border: "1px solid rgba(46,230,201,0.32)",
              color: "rgba(220,255,248,0.92)",
              fontSize: 12.5,
              lineHeight: 1.45,
            }}
          >
            {t("akimat_empty_hint")}
          </div>
        )}

        <div className="space-y-5">
          {/* Stat tiles — 2 columns × 3 rows */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={<Activity size={16} strokeWidth={2.2} />}
              label={t("akimat_total")}
              value={data ? data.totalSnapshots.toLocaleString() : "—"}
              delay={0}
            />
            <StatTile
              icon={<Users size={16} strokeWidth={2.2} />}
              label={t("akimat_explorers")}
              value={data ? data.uniqueExplorers.toLocaleString() : "—"}
              delay={0.04}
            />
            <StatTile
              icon={<Footprints size={16} strokeWidth={2.2} />}
              label={t("akimat_last7")}
              value={data ? data.last7Days.toLocaleString() : "—"}
              delay={0.08}
            />
            <StatTile
              icon={<Footprints size={16} strokeWidth={2.2} />}
              label={t("akimat_last30")}
              value={data ? data.last30Days.toLocaleString() : "—"}
              delay={0.12}
            />
            <StatTile
              icon={<Activity size={16} strokeWidth={2.2} />}
              label={t("akimat_avg_day")}
              value={data ? avgPerDay.toFixed(1) : "—"}
              delay={0.16}
            />
            <StatTile
              icon={<MapPin size={16} strokeWidth={2.2} />}
              label={t("akimat_top_share")}
              value={data && topSharePct > 0 ? `${topSharePct}%` : "—"}
              delay={0.2}
            />
          </div>

          {/* Secondary insights row */}
          <div
            className="grid grid-cols-2 gap-3 rounded-2xl p-3"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Insight
              label={t("akimat_peak_day")}
              value={peakDay ? `${fmtDay(peakDay.day)} · ${peakDay.count}` : "—"}
            />
            <Insight
              label={t("akimat_active_days")}
              value={data ? `${activeDays} / 14` : "—"}
            />
            <Insight
              label={t("akimat_busiest_hour")}
              value={busiestHour ? `${String(busiestHour.hour).padStart(2, "0")}:00 · ${busiestHour.count}` : "—"}
            />
            <Insight
              label={data?.sampleWindow === "capped_5000" ? t("akimat_sample_capped") : t("akimat_sample_full")}
              value={data ? data.totalSnapshots.toLocaleString() : "—"}
              small
            />
          </div>

          {/* Top sights */}
          <Section title={t("akimat_top_sights")}>
            {data && data.bySight.length > 0 ? (
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
            ) : (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="h-2.5 flex-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                    <div
                      className="h-2 flex-[2] rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                  </div>
                ))}
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                  {t("akimat_no_sights")}
                </p>
              </div>
            )}
          </Section>

          {/* By day */}
          <Section title={t("akimat_by_day")}>
            <div className="flex h-28 items-end gap-1">
              {dayCells.map((d, i) => {
                const ratio = d.count / dayMax;
                const h = data ? Math.max(2, ratio * 100) : 6;
                const isPeak = peakDay ? d.day === peakDay.day : false;
                return (
                  <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <motion.span
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.02 * i, duration: 0.55, ease }}
                      className="w-full rounded-t-md"
                      style={{
                        background: isPeak
                          ? "linear-gradient(180deg, #fff, var(--iz-accent))"
                          : data
                          ? "linear-gradient(180deg, var(--iz-accent), rgba(46,230,201,0.35))"
                          : "rgba(255,255,255,0.08)",
                        boxShadow: isPeak ? "0 0 18px rgba(46,230,201,0.55)" : data ? "0 0 14px rgba(46,230,201,0.22)" : undefined,
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
              {hourCells.map((b, i) => {
                const ratio = b.count / hourMax;
                const h = data ? Math.max(2, ratio * 100) : 6;
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
                          : data
                          ? "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(46,230,201,0.3))"
                          : "rgba(255,255,255,0.08)",
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

          {/* Legend + footer */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 11,
            }}
          >
            <Sun size={13} strokeWidth={2} />
            <span>{t("akimat_legend")}</span>
          </div>

          {data && (
            <p
              className="pt-1 text-center"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}
            >
              {t("akimat_updated")} · {fmtTime(data.generatedAt)}
            </p>
          )}
        </div>
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
  value: string;
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
        style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.05, marginTop: 6 }}
      >
        {value}
      </p>
    </motion.div>
  );
}

function Insight({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p
        className="truncate"
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        className="tabular-nums truncate"
        style={{ fontSize: small ? 13 : 15, fontWeight: 600, color: "#fff", marginTop: 2 }}
      >
        {value}
      </p>
    </div>
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
