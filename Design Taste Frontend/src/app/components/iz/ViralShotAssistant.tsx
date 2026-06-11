import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, MoveLeft, Aperture, Waves, Quote, RefreshCw, Camera, Check, Copy, Hash, Pose, Crop, Sun } from "./Icons";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Card, Button, IconChip, Overline } from "./ui";
import { useI18n } from "./i18n";
import { LangSwitcher } from "./LangSwitcher";
import { useStore } from "./store";
import { goldenHour } from "./sun";

const PREVIEW_IMG = "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=900&q=80";

type Phase = "idle" | "scanning" | "done";
type Cat = "pose" | "angle" | "light" | "caption" | "tags";
const ease = [0.16, 1, 0.3, 1] as const;

const HASHTAGS = ["#mangystau", "#bozzhyra", "#caspiansea", "#kazakhstan", "#goldenhour", "#desertvibes", "#travelreels"];

export function ViralShotAssistant() {
  const { t } = useI18n();
  const { addShot, shots } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [cat, setCat] = useState<Cat>("pose");
  const [photo, setPhoto] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const golden = useMemo(() => goldenHour(), []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(URL.createObjectURL(file)); setPhase("idle"); }
  };

  const generate = () => {
    setPhase("scanning");
    setTimeout(() => { setPhase("done"); addShot("Bozzhyra Canyon"); }, 2000);
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

  const tipRow = (Icon: typeof Pose, text: string, key: string, delay: number) => (
    <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.35, ease }} className="flex items-center gap-3 py-2.5">
      <IconChip tone="accent" size={34}><Icon size={17} strokeWidth={2} /></IconChip>
      <span style={{ fontSize: 14, color: "var(--iz-ink)", fontWeight: 500 }}>{text}</span>
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

      {/* Empty state or analysis */}
      <AnimatePresence mode="wait">
        {phase !== "done" ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card inset className="flex flex-col items-center gap-1.5 px-6 py-7 text-center">
              <IconChip tone="accent" size={44}><Sparkles size={22} strokeWidth={2} /></IconChip>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--iz-ink)", marginTop: 6 }}>{t("no_plan")}</p>
              <p style={{ fontSize: 13, color: "var(--iz-ink-2)" }}>{t("no_plan_sub")}</p>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Overline>{t("your_plan")}</Overline>
              <span className="flex items-center gap-1" style={{ color: "var(--iz-accent)", fontSize: 12, fontWeight: 600 }}>
                <Check size={13} strokeWidth={3} /> {shots} {t("shots_saved_n")}
              </span>
            </div>

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
                      {[t("pose_1"), t("pose_2"), t("pose_3")].map((x, i) => tipRow(Pose, x, x, i * 0.06))}
                    </div>
                  )}

                  {cat === "angle" && (
                    <div>
                      <div className="mb-1 flex items-center gap-3 py-2">
                        <IconChip tone="accent" size={40}><Aperture size={20} strokeWidth={2} /></IconChip>
                        <div>
                          <p style={{ fontSize: 19, fontWeight: 700, color: "var(--iz-ink)", lineHeight: 1 }}>0.5×</p>
                          <p style={{ fontSize: 12, color: "var(--iz-ink-2)" }}>{t("tip_wide")}</p>
                        </div>
                      </div>
                      <div className="divide-y divide-[var(--iz-border)]">
                        {tipRow(Crop, t("angle_2"), "a2", 0.04)}
                        {tipRow(MoveLeft, t("tip_left"), "a3", 0.1)}
                      </div>
                    </div>
                  )}

                  {cat === "light" && (
                    <div>
                      <div className="mb-1 flex items-center gap-3 py-2">
                        <IconChip tone="accent" size={40}><Sun size={20} strokeWidth={2} /></IconChip>
                        <div>
                          <p style={{ fontSize: 12, color: "var(--iz-ink-2)" }}>{t("light_at")}</p>
                          <p style={{ fontSize: 19, fontWeight: 700, color: "var(--iz-ink)", lineHeight: 1 }}>{golden.start}–{golden.sunset}</p>
                        </div>
                      </div>
                      <div className="divide-y divide-[var(--iz-border)]">
                        {tipRow(Waves, t("tip_sea"), "l1", 0.04)}
                        {tipRow(Sun, t("light_2"), "l2", 0.1)}
                      </div>
                    </div>
                  )}

                  {cat === "caption" && (
                    <div className="py-1">
                      <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--iz-ink)", fontWeight: 500 }}>“{t("caption_text")}”</p>
                      <Button variant="primary" full size="sm" onClick={() => flashCopy(t("caption_text"), "caption")} className="mt-3">
                        {copied === "caption" ? <><Check size={16} strokeWidth={2.6} /> {t("copied")}</> : <><Copy size={16} strokeWidth={2} /> {t("copy")}</>}
                      </Button>
                    </div>
                  )}

                  {cat === "tags" && (
                    <div className="py-1">
                      <div className="flex flex-wrap gap-2">
                        {HASHTAGS.map((h) => (
                          <button key={h} onClick={() => flashCopy(h, h)} className="rounded-full px-3 py-1.5 focus-visible:outline-none" style={{ fontSize: 13, fontWeight: 600, background: copied === h ? "var(--iz-accent-soft)" : "var(--iz-surface-2)", color: copied === h ? "var(--iz-accent)" : "var(--iz-ink-2)" }}>
                            {copied === h ? t("copied") : h}
                          </button>
                        ))}
                      </div>
                      <Button variant="secondary" full size="sm" onClick={() => flashCopy(HASHTAGS.join(" "), "all")} className="mt-3">
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

      <Button full onClick={generate} disabled={phase === "scanning"} className="py-4" style={{ fontSize: 15 }}>
        {phase === "scanning" ? <><RefreshCw size={18} strokeWidth={2.3} className="animate-spin" /> {t("scanning_btn")}</>
          : phase === "done" ? <><RefreshCw size={18} strokeWidth={2.3} /> {t("regenerate")}</>
          : <><Sparkles size={18} strokeWidth={2.3} /> {t("generate")}</>}
      </Button>
    </div>
  );
}
