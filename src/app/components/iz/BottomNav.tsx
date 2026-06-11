import { motion } from "motion/react";
import { Home, Users, Aperture, Compass, User, type IconProps } from "./Icons";
import type { TabId } from "./types";
import { useI18n, STRINGS } from "./i18n";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; key: keyof typeof STRINGS; Icon: (p: IconProps) => JSX.Element }[] = [
  { id: "pulse", key: "nav_pulse", Icon: Home },
  { id: "crew", key: "nav_crew", Icon: Users },
  { id: "lens", key: "nav_lens", Icon: Aperture },
  { id: "quests", key: "nav_quests", Icon: Compass },
  { id: "profile", key: "nav_profile", Icon: User },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-30 flex items-stretch px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl"
      style={{ background: "var(--iz-glass-bg-strong)", borderTop: "1px solid var(--iz-glass-border)", boxShadow: "var(--iz-glass-hi)" }}
    >
      {tabs.map(({ id, key, Icon }) => {
        const isActive = active === id;
        const label = t(key);
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className="relative flex flex-1 flex-col items-center gap-1 py-1.5 focus-visible:outline-none"
            style={{ color: isActive ? "var(--iz-accent)" : "var(--iz-ink-3)" }}
          >
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute -top-1.5 h-1 w-6 rounded-full"
                style={{ background: "var(--iz-accent)", boxShadow: "var(--iz-glow)" }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            )}
            <motion.span animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }} transition={{ type: "spring", stiffness: 420, damping: 24 }} className="flex">
              <Icon size={23} strokeWidth={2} />
            </motion.span>
            <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
