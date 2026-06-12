import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TouristPulse } from "./TouristPulse";
import { CrewMap } from "./CrewMap";
import { ViralShotAssistant } from "./ViralShotAssistant";
import { ProfileMini } from "./ProfileMini";
import { VoiceChat } from "./VoiceChat";
import { AkimatDashboard } from "./AkimatDashboard";
import type { TabId } from "./types";

export function AppShell() {
  const [tab, setTab] = useState<TabId>("pulse");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [akimatOpen, setAkimatOpen] = useState(false);

  const openVoice = () => setVoiceOpen(true);
  const openAkimat = () => setAkimatOpen(true);

  const renderScreen = () => {
    switch (tab) {
      case "pulse":
        return <TouristPulse onNavigate={setTab} onOpenVoice={openVoice} />;
      case "crew":
        return <CrewMap onNavigate={setTab} />;
      case "lens":
        return <ViralShotAssistant onNavigate={setTab} />;
      case "profile":
        return <ProfileMini onOpenAkimat={openAkimat} />;
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ color: "var(--iz-ink)" }}>
      <div className="relative z-10 h-full w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14, scale: 0.985, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, scale: 0.99, filter: "blur(4px)" }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav active={tab} onChange={setTab} onOpenVoice={openVoice} />
      <AnimatePresence>
        {voiceOpen && <VoiceChat onClose={() => setVoiceOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {akimatOpen && <AkimatDashboard onClose={() => setAkimatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
