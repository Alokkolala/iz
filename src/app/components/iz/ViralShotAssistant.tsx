import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Aperture, Quote, RefreshCw, Camera, Check, Copy, Hash, Pose, Crop, Sun } from "./Icons";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Card, Button, IconChip, Overline } from "./ui";
import { useI18n } from "./i18n";
import { LangSwitcher } from "./LangSwitcher";
import { useStore } from "./store";

const PREVIEW_IMG = "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=900&q=80";

type Phase = "idle" | "scanning" | "done" | "error";
type Cat = "pose" | "angle" | "light" | "caption" | "tags";
const ease = [0.16, 1, 0.3, 1] as const;

interface Tip { title: string; detail: string }
interface Reference {
  src: string;
  tip: string;
  attribution: string;
  sourceUrl: string;
  license: string;
}
interface Analysis {
  sightGuess: string;
  confidence: number;
  pose: Tip[];
  angle: Tip[];
  light: { bestTime: string; tips: Tip[] };
  caption: string;
  hashtags: string[];
  references?: Reference[];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ViralShotAssistant() {
  const { t } = useI18n();
  const { addShot, shots } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [cat, setCat] = useState<Cat>("pose");
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPhoto(dataUrl);
    setPhase("idle");
    setAnalysis(null);
    setErrorMsg(null);
  };

  const generate = async () => {
    if (!photo) return;
    setPhase("scanning");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageDataUrl: photo }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "request failed" }));
        throw new Error(err.error ?? "analysis failed");
      }
      const data: Analysis = await res.json();
      setAnalysis(data);
      setPhase("done");
      addShot(data.sightGuess || "Mangystau");
    } catch (e: unknown) {
      setPhase("error");
      setErrorMsg(e instanceof Error ? e.message : "analysis failed");
    }
  };

  const flashCopy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard may be blocked */ }
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const cats: { id: Cat; label: string; Icon: typeof Pose }[] = [
    { id: "pose", label: t("cat_pose"), Icon: Pose },
    { id: "angle", label: t("cat_angle"), Icon: Crop },
    { id: "light", label: t("cat_light"), Icon: Sun },
    { id: "caption", label: t("cat_caption"), Icon: Quote },
    { id: "tags", label: t("cat_tags"), Icon: Hash },
  ];

  const tipRow = (Icon: typeof Pose, tip: Tip, key: string, delay: number) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease }}
      className="flex items-start gap-3 py-2.5"
    >
      <IconChip tone="accent" size={34}><Icon size={17} strokeWidth={2} /></IconChip>
      <div className="flex-1">
        <p style={{ fontSize: 14, color: "var(--iz-ink)", fontWeight: 600, lineHeight: 1.25 }}>{tip.title}</p>
        <p style={{ fontSize: 12.5, color: "var(--iz-ink-2)", marginTop: 2, lineHeight: 1.35 }}>{tip.detail}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-5 pb-28 pt-12">
      <div className="flex items-start justify-between">
        <div>
          <Overline>{t("lens_kicker")}</Overline>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--iz-ink)" }}>{t("lens_title")}</h1>
        </div>
        <LangSwitcher />
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      {/* Photo */}
      <Card flush className="overflow-hidden">
        <div className="relative">
          <ImageWithFallback src={photo ?? PREVIEW_IMG} alt="Shot preview" className="h-72 w-full object-cover" />

          <button onClick={() => fileRef.current?.click()} className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 focus-visible:outline-none" style={{ background: "rgba(255,255,255,0.92)", color: "var(--iz-ink)", fontSize: 12, fontWeight: 600 }}>
            <Camera size={15} strokeWidth={2} /> {photo ? t("change_photo") : t("upload_photo")}
          </button>

          {phase === "done" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute inset-0">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {[33.3, 66.6].map((v) => <line key={`x${v}`} x1={v} y1="0" x2={v} y2="100" stroke="#fff" strokeWidth="0.35" opacity="0.65" />)}
                {[33.3, 66.6].map((v) => <line key={`y${v}`} x1="0" y1={v} x2="100" y2={v} stroke="#fff" strokeWidth="0.35" opacity="0.65" />)}
              </svg>
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: "66.6%", top: "66.6%" }} />
              <div className="absolute bottom-3 left-3 rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.92)", color: "var(--iz-ink)", fontSize: 11, fontWeight: 600 }}>{t("framing")}</div>
            </motion.div>
          )}

          <AnimatePresence>
            {phase === "scanning" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden">
                <span className="absolute left-0 right-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, rgba(46,230,201,0.5), transparent)", animation: "iz-scan 1.6s ease-in-out infinite" }} />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5" style={{ background: "rgba(255,255,255,0.92)", color: "var(--iz-ink)", fontSize: 13, fontWeight: 600 }}>{t("scanning")}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Empty / Error / Results */}
      <AnimatePresence mode="wait">
        {phase === "error" && (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card inset className="flex flex-col items-center gap-1.5 px-6 py-6 text-center">
              <p style={{ fontSize: 14, fontWeight: 600, color: "#ff6b6b" }}>Couldn’t analyze the shot</p>
              <p style={{ fontSize: 12.5, color: "var(--iz-ink-2)" }}>{errorMsg}</p>
            </Card>
          </motion.div>
        )}

        {(phase === "idle" || phase === "scanning") && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card inset className="flex flex-col items-center gap-1.5 px-6 py-7 text-center">
              <IconChip tone="accent" size={44}><Sparkles size={22} strokeWidth={2} /></IconChip>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--iz-ink)", marginTop: 6 }}>{t("no_plan")}</p>
              <p style={{ fontSize: 13, color: "var(--iz-ink-2)" }}>{t("no_plan_sub")}</p>
            </Card>
          </motion.div>
        )}

        {phase === "done" && analysis && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Overline>{analysis.sightGuess || t("your_plan")}</Overline>
              <span className="flex items-center gap-1" style={{ color: "var(--iz-accent)", fontSize: 12, fontWeight: 600 }}>
                <Check size={13} strokeWidth={3} /> {shots} {t("shots_saved_n")}
              </span>
            </div>

            {/* reference reel — "what good looks like" */}
            {analysis.references && analysis.references.length > 0 && (
              <div className="flex flex-col gap-2">
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--iz-ink)" }}>{t("ref_reel_title")}</p>
                <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}>
                  {analysis.references.map((ref, i) => (
                    <motion.a
                      key={ref.src}
                      href={ref.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35, ease }}
                      className="relative block shrink-0 overflow-hidden"
                      style={{
                        width: 220,
                        height: 280,
                        borderRadius: "var(--iz-r-lg)",
                        border: "1px solid var(--iz-border)",
                        boxShadow: "var(--iz-glass-shadow)",
                        scrollSnapAlign: "start",
                      }}
                    >
                      <ImageWithFallback src={ref.src} alt={ref.tip} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0))" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>{ref.tip}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                          {t("ref_by")} {ref.attribution} · {ref.license}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}

            {/* category tabs */}
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5" style={{ scrollbarWidth: "none" }}>
              {cats.map((c) => {
                const on = c.id === cat;
                return (
                  <button key={c.id} onClick={() => setCat(c.id)} className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 backdrop-blur-md focus-visible:outline-none" style={{ fontSize: 13, fontWeight: 600, background: on ? "var(--iz-accent)" : "var(--iz-glass-bg-strong)", color: on ? "var(--iz-on-accent)" : "var(--iz-ink-2)", border: on ? "none" : "1px solid var(--iz-glass-border)", boxShadow: on ? "var(--iz-glow)" : "none" }}>
                    <c.Icon size={15} strokeWidth={2} /> {c.label}
                  </button>
                );
              })}
            </div>

            <Card className="px-4 py-1.5">
              <AnimatePresence mode="wait">
                <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="py-1.5">
                  {cat === "pose" && (
                    <div className="divide-y divide-[var(--iz-border)]">
                      {analysis.pose.map((tip, i) => tipRow(Pose, tip, `pose-${i}`, i * 0.06))}
                    </div>
                  )}

                  {cat === "angle" && (
                    <div className="divide-y divide-[var(--iz-border)]">
                      {analysis.angle.map((tip, i) => tipRow(i === 0 ? Aperture : Crop, tip, `angle-${i}`, i * 0.06))}
                    </div>
                  )}

                  {cat === "light" && (
                    <div>
                      <div className="mb-1 flex items-center gap-3 py-2">
                        <IconChip tone="accent" size={40}><Sun size={20} strokeWidth={2} /></IconChip>
                        <div>
                          <p style={{ fontSize: 12, color: "var(--iz-ink-2)" }}>{t("light_at")}</p>
                          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--iz-ink)", lineHeight: 1.1 }}>{analysis.light.bestTime}</p>
                        </div>
                      </div>
                      <div className="divide-y divide-[var(--iz-border)]">
                        {analysis.light.tips.map((tip, i) => tipRow(Sun, tip, `light-${i}`, i * 0.06))}
                      </div>
                    </div>
                  )}

                  {cat === "caption" && (
                    <div className="py-1">
                      <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--iz-ink)", fontWeight: 500 }}>“{analysis.caption}”</p>
                      <Button variant="primary" full size="sm" onClick={() => flashCopy(analysis.caption, "caption")} className="mt-3">
                        {copied === "caption" ? <><Check size={16} strokeWidth={2.6} /> {t("copied")}</> : <><Copy size={16} strokeWidth={2} /> {t("copy")}</>}
                      </Button>
                    </div>
                  )}

                  {cat === "tags" && (
                    <div className="py-1">
                      <div className="flex flex-wrap gap-2">
                        {analysis.hashtags.map((h) => (
                          <button key={h} onClick={() => flashCopy(h, h)} className="rounded-full px-3 py-1.5 focus-visible:outline-none" style={{ fontSize: 13, fontWeight: 600, background: copied === h ? "var(--iz-accent-soft)" : "var(--iz-surface-2)", color: copied === h ? "var(--iz-accent)" : "var(--iz-ink-2)" }}>
                            {copied === h ? t("copied") : h}
                          </button>
                        ))}
                      </div>
                      <Button variant="secondary" full size="sm" onClick={() => flashCopy(analysis.hashtags.join(" "), "all")} className="mt-3">
                        {copied === "all" ? <><Check size={16} strokeWidth={2.6} /> {t("copied")}</> : <><Hash size={16} strokeWidth={2} /> {t("copy_tags")}</>}
                      </Button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button full onClick={generate} disabled={!photo || phase === "scanning"} className="py-4" style={{ fontSize: 15 }}>
        {phase === "scanning" ? <><RefreshCw size={18} strokeWidth={2.3} className="animate-spin" /> {t("scanning_btn")}</>
          : phase === "done" ? <><RefreshCw size={18} strokeWidth={2.3} /> {t("regenerate")}</>
          : <><Sparkles size={18} strokeWidth={2.3} /> {t("generate")}</>}
      </Button>
    </div>
  );
}
