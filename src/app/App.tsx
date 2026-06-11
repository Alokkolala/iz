import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SplashScreen } from "./components/iz/SplashScreen";
import { AppShell } from "./components/iz/AppShell";
import { AnimatedBackground } from "./components/iz/AnimatedBackground";
import { I18nProvider } from "./components/iz/i18n";
import { AppStateProvider } from "./components/iz/store";
import { AuthProvider } from "../lib/AuthProvider";
import { AuthGate } from "./components/auth/AuthGate";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <AuthProvider>
    <I18nProvider>
    <AppStateProvider>
    <div className="flex min-h-[100dvh] w-full items-center justify-center p-0 sm:p-6" style={{ background: "var(--iz-page)" }}>
      {/* Phone frame — fills small screens, scales to a centered device on larger ones */}
      <div className="relative h-[100dvh] w-full max-w-[440px] overflow-hidden shadow-2xl sm:h-[min(880px,94vh)] sm:w-auto sm:aspect-[390/844] sm:rounded-[44px] sm:border sm:border-[var(--iz-border-strong)]" style={{ background: "var(--iz-bg)" }}>
        {/* one living fluid backdrop behind everything; glass surfaces refract it */}
        <AnimatedBackground />
        <div className="relative z-10 h-full w-full">
        <AuthGate>
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.div
              key="splash"
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.4 }}
              className="h-full w-full"
            >
              <SplashScreen onStart={() => setStarted(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full w-full"
            >
              <AppShell />
            </motion.div>
          )}
        </AnimatePresence>
        </AuthGate>
        </div>
      </div>
    </div>
    </AppStateProvider>
    </I18nProvider>
    </AuthProvider>
  );
}
