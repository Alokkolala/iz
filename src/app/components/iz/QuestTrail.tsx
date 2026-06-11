import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Sun, Shell, Route, Minus, Award, Camera, Compass, Check } from "./Icons";
import { Card, IconChip, Overline } from "./ui";
import { useI18n } from "./i18n";
import { LangSwitcher } from "./LangSwitcher";
import { useStore } from "./store";

const ease = [0.16, 1, 0.3, 1] as const;

export function QuestTrail() {
  const { t } = useI18n();
  const { quests, bumpQuest, shots, completedQuests } = useStore();
  const [toast, setToast] = useState(false);

  const defs = [
    { id: "1", title: t("q1"), hint: t("q1h"), Icon: Sun },
    { id: "2", title: t("q2"), hint: t("q2h"), Icon: Shell },
    { id: "3", title: t("q3"), hint: t("q3h"), Icon: Route },
    { id: "4", title: t("q4"), hint: t("q4h"), Icon: Minus },
  ];

  const badges = [
    { name: t("badge_creator"), Icon: Camera, earned: shots >= 3 },
    { name: t("badge_scout"), Icon: Compass, earned: completedQuests >= 2 },
    { name: t("badge_hunter"), Icon: Shell, earned: (quests["2"] ?? 0) >= 100 },
  ];

  const onTap = (id: string, label: string) => {
    const before = quests[id] ?? 0;
    if (before >= 100) return;
    const next = bumpQuest(id, label);
    if (next >= 100) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ["#2ee6c9", "#19c7ac", "#aab4be", "#ffffff"] });
      setToast(true);
      setTimeout(() => setToast(false), 1700);
    }
  };

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-5 pb-28 pt-12">
      <div className="flex items-start justify-between">
        <div>
          <Overline>{t("quests_kicker")}</Overline>
          <h1 className="font-display" style={{ fontSize: 27, fontWeight: 700, color: "var(--iz-ink)" }}>{t("quests_title")}</h1>
        </div>
        <LangSwitcher />
      </div>

      {/* Badges */}
      <div>
        <Overline className="mb-3">{t("your_badges")}</Overline>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((b, i) => (
            <motion.div key={b.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease }}>
              <Card className="flex flex-col items-center gap-2 p-3.5 text-center" style={{ opacity: b.earned ? 1 : 0.55 }}>
                <IconChip tone={b.earned ? "accent" : "neutral"} size={40}><b.Icon size={19} strokeWidth={2} /></IconChip>
                <span style={{ fontSize: 11, lineHeight: 1.25, color: "var(--iz-ink)", fontWeight: 500 }}>{b.name}</span>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quests */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Overline>{t("quests_title")}</Overline>
          <span style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>{completedQuests}/{defs.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {defs.map((q, i) => {
            const progress = quests[q.id] ?? 0;
            const done = progress >= 100;
            return (
              <motion.button
                key={q.id}
                onClick={() => onTap(q.id, q.title)}
                whileTap={{ scale: done ? 1 : 0.99 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease }}
                className="text-left focus-visible:outline-none"
              >
                <Card className="flex items-center gap-3.5 p-4">
                  <IconChip tone={done ? "accent" : "neutral"} size={44}>
                    {done ? <Check size={22} strokeWidth={2.6} /> : <q.Icon size={21} strokeWidth={2} />}
                  </IconChip>
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--iz-ink)", lineHeight: 1.3 }}>{q.title}</p>
                    <p className="mt-0.5 flex items-center gap-1" style={{ fontSize: 12, color: done ? "var(--iz-accent)" : "var(--iz-ink-3)" }}>
                      {done && <Award size={13} strokeWidth={2.2} />}
                      {done ? t("completed") : q.hint}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--iz-surface-2)" }}>
                      <motion.span className="block h-full rounded-full" style={{ background: "var(--iz-accent)", boxShadow: "0 0 10px rgba(46,230,201,0.55)" }} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 160, damping: 22 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--iz-ink)" }}>{progress}%</span>
                </Card>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-3 text-center" style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>{t("tap_progress")}</p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full px-5 py-3" style={{ background: "var(--iz-accent)", color: "var(--iz-on-accent)", boxShadow: "var(--iz-glow)" }}>
              <Award size={17} strokeWidth={2.4} /> <span style={{ fontWeight: 600 }}>{t("quest_done")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
