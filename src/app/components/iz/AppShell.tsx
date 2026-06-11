import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TouristPulse } from "./TouristPulse";
import { CrewMap } from "./CrewMap";
import { ViralShotAssistant } from "./ViralShotAssistant";
import { ProfileMini } from "./ProfileMini";
import { VoiceChat } from "./VoiceChat";
import type { TabId } from "./types";

export function AppShell() {
  const [tab, setTab] = useState<TabId>("pulse");
  const [voiceOpen, setVoiceOpen] = useState(false);

  const openVoice = () => setVoiceOpen(true);

  const renderScreen = () => {
    switch (tab) {
      case "pulse":
        return <TouristPulse onNavigate={setTab} onOpenVoice={openVoice} />;
      case "crew":
        return <CrewMap onNavigate={setTab} />;
      case "lens":
        return <ViralShotAssistant onNavigate={setTab} />;
      case "profile":
        return <ProfileMini />;
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ color: "var(--iz-ink)" }}>
      <div className="relative z-10 h-full w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav active={tab} onChange={setTab} />
      <AnimatePresence>
        {voiceOpen && <VoiceChat onClose={() => setVoiceOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
