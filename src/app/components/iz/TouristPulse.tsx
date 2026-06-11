import { useMemo } from "react";
import { motion } from "motion/react";
import { Camera, MapPin, Compass, Sun, ArrowRight, ArrowUpRight } from "./Icons";
import { Stone3D } from "./Stone3D";
import { Card, Button, IconChip, Overline } from "./ui";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { TabId } from "./types";
import { useI18n } from "./i18n";
import { LangSwitcher } from "./LangSwitcher";
import { useStore } from "./store";
import { goldenHour } from "./sun";

interface TouristPulseProps {
  onNavigate: (tab: TabId) => void;
}

const ease = [0.16, 1, 0.3, 1] as const;
const rise = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.45, ease } });

const PHOTO_BOZZHYRA = "https://images.unsplash.com/photo-1774537346157-d84e5480a666?auto=format&fit=crop&w=900&q=80";
const PHOTO_BAY = "https://images.unsplash.com/photo-1780845163089-c57658002946?auto=format&fit=crop&w=600&q=80";
const PHOTO_TUZBAIR = "https://images.unsplash.com/photo-1775484866877-3e55f1f44fe4?auto=format&fit=crop&w=600&q=80";

export function TouristPulse({ onNavigate }: TouristPulseProps) {
  const { t } = useI18n();
  const { name, shots, spots, completedQuests } = useStore();
  const golden = useMemo(() => goldenHour(), []);

  const journey = [
    { label: t("shots"), value: shots, Icon: Camera },
    { label: t("spots"), value: spots, Icon: MapPin },
    { label: t("quests_done_short"), value: completedQuests, Icon: Compass },
  ];
  const hasJourney = shots > 0 || spots > 0 || completedQuests > 0;
  const trending = [
    { src: PHOTO_BAY, name: t("spot_blue") },
    { src: PHOTO_TUZBAIR, name: t("spot_tuzbair") },
  ];

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-5 pb-28 pt-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0"><Stone3D lite className="h-12 w-12" /></div>
        <div className="min-w-0 flex-1">
          <Overline>{t("pulse_kicker")}</Overline>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--iz-ink)" }}>
            {name ? t("greet_hi").replace("Iz", name) : t("greet_hi")}
          </p>
        </div>
        <LangSwitcher />
      </div>

      <h1 className="font-display" style={{ fontSize: 27, lineHeight: 1.12, fontWeight: 700, color: "var(--iz-ink)", marginTop: -8 }}>
        {t("pulse_title")}
      </h1>

      {/* Featured destination */}
      <motion.div {...rise(0)}>
        <Card flush className="overflow-hidden">
          <button onClick={() => onNavigate("lens")} className="relative block w-full text-left focus-visible:outline-none">
            <ImageWithFallback src={PHOTO_BOZZHYRA} alt={t("spot_bozzhyra")} className="h-48 w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(16,24,40,0.72), rgba(16,24,40,0.05) 55%, transparent)" }} />
            <span className="absolute left-3 top-3 rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.92)", color: "var(--iz-accent)", fontSize: 11, fontWeight: 600 }}>{t("trending")}</span>
            <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white/75" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>{t("featured_today")}</p>
                <p className="font-display truncate text-white" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>{t("spot_bozzhyra")}</p>
                <p className="text-white/80" style={{ fontSize: 12 }}>{t("spot_bozzhyra_sub")}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--iz-accent)", color: "var(--iz-on-accent)", boxShadow: "var(--iz-glow)" }}>
                <ArrowUpRight size={19} strokeWidth={2.4} />
              </span>
            </div>
          </button>
        </Card>
      </motion.div>

      {/* Golden hour */}
      <motion.div {...rise(1)}>
        <Card className="flex items-center gap-3.5 p-4">
          <IconChip tone="accent" size={42}><Sun size={21} strokeWidth={2.1} /></IconChip>
          <div className="flex-1">
            <p style={{ fontSize: 12, color: "var(--iz-ink-2)", fontWeight: 500 }}>{t("golden_hour")}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--iz-ink)", lineHeight: 1.1 }}>{golden.start}–{golden.sunset}</p>
          </div>
        </Card>
      </motion.div>

      {/* Your journey */}
      <div>
        <Overline className="mb-3">{t("your_journey")}</Overline>
        <div className="grid grid-cols-3 gap-3">
          {journey.map((s, i) => (
            <motion.div key={s.label} {...rise(i + 2)}>
              <Card className="flex flex-col items-center gap-2 p-3.5">
                <IconChip size={36}><s.Icon size={18} strokeWidth={2} /></IconChip>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--iz-ink)", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "var(--iz-ink-3)" }}>{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
        {!hasJourney && <p className="mt-3 text-center" style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>{t("journey_empty")}</p>}
      </div>

      {/* Trending */}
      <div>
        <Overline className="mb-3">{t("moments")}</Overline>
        <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
          {trending.map((s, i) => (
            <motion.div key={s.name} {...rise(i + 2)}>
              <Card flush className="snap-center overflow-hidden">
                <button onClick={() => onNavigate("lens")} className="relative block h-40 w-44 text-left focus-visible:outline-none">
                  <ImageWithFallback src={s.src} alt={s.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(16,24,40,0.7), transparent 58%)" }} />
                  <p className="absolute inset-x-3 bottom-2.5 text-white" style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</p>
                </button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Button variant="secondary" full onClick={() => onNavigate("crew")} style={{ justifyContent: "space-between", paddingLeft: 18, paddingRight: 16 }}>
        <span style={{ fontWeight: 600 }}>{t("start_crew")}</span>
        <ArrowRight size={18} strokeWidth={2.2} style={{ color: "var(--iz-accent)" }} />
      </Button>
    </div>
  );
}
