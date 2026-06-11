import { motion } from "motion/react";
import { Home, Users, Aperture, User, type IconProps } from "./Icons";
import type { TabId } from "./types";
import { useI18n, STRINGS } from "./i18n";
import { WaterDropButton } from "./WaterDropButton";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onOpenVoice: () => void;
}

type Tab = { id: TabId; key: keyof typeof STRINGS; Icon: (p: IconProps) => JSX.Element };

const leftTabs: Tab[] = [
  { id: "pulse", key: "nav_pulse", Icon: Home },
  { id: "crew", key: "nav_crew", Icon: Users },
];
const rightTabs: Tab[] = [
  { id: "lens", key: "nav_lens", Icon: Aperture },
  { id: "profile", key: "nav_profile", Icon: User },
];

function TabButton({ tab, isActive, onChange, label }: {
  tab: Tab; isActive: boolean; onChange: (id: TabId) => void; label: string;
}) {
  const { Icon, id } = tab;
  return (
    <button
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
      <motion.span
        animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        className="flex"
      >
        <Icon size={23} strokeWidth={2} />
      </motion.span>
      <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500 }}>{label}</span>
    </button>
  );
}

export function BottomNav({ active, onChange, onOpenVoice }: BottomNavProps) {
  const { t } = useI18n();
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-30 flex items-end px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl"
      style={{
        background: "var(--iz-glass-bg-strong)",
        borderTop: "1px solid var(--iz-glass-border)",
        boxShadow: "var(--iz-glass-hi)",
      }}
    >
      {leftTabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={active === tab.id}
          onChange={onChange}
          label={t(tab.key)}
        />
      ))}
      <div className="flex w-16 shrink-0 items-end justify-center">
        <WaterDropButton onClick={onOpenVoice} ariaLabel={t("voice_open_drop")} />
      </div>
      {rightTabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={active === tab.id}
          onChange={onChange}
          label={t(tab.key)}
        />
      ))}
    </nav>
  );
}
