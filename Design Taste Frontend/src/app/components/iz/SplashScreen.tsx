import { motion } from "motion/react";
import { ArrowRight } from "./Icons";
import { Stone3D } from "./Stone3D";
import { Button } from "./ui";
import { LangSwitcher } from "./LangSwitcher";
import { useI18n } from "./i18n";

interface SplashScreenProps {
  onStart: () => void;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function SplashScreen({ onStart }: SplashScreenProps) {
  const { t } = useI18n();

  return (
    <div className="relative flex h-full w-full flex-col px-7 pb-10 pt-7">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 12, letterSpacing: "0.18em", color: "var(--iz-ink-2)", fontWeight: 600 }}>{t("brand_sub")}</span>
        <LangSwitcher />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease }} className="relative">
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "var(--iz-accent)", opacity: 0.22, filter: "blur(70px)" }} />
          <Stone3D className="relative h-56 w-56" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease }}
          className="font-display mt-10 max-w-[12ch] text-center text-[34px] leading-[1.1]"
          style={{ fontWeight: 700, color: "var(--iz-ink)" }}
        >
          {t("splash_title")}
        </motion.h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6, ease }}>
        <Button onClick={onStart} full size="md" className="py-4" style={{ fontSize: 16 }}>
          {t("splash_cta")} <ArrowRight size={20} strokeWidth={2.4} />
        </Button>
      </motion.div>
    </div>
  );
}
