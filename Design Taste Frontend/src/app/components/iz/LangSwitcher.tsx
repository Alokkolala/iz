import { motion } from "motion/react";
import { useI18n, LANGS } from "./i18n";

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 backdrop-blur-xl"
      style={{ background: "var(--iz-glass-bg-strong)", borderRadius: "var(--iz-r-pill)", border: "1px solid var(--iz-glass-border)", boxShadow: "var(--iz-glass-hi)" }}
    >
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <button
            key={l.id}
            onClick={() => setLang(l.id)}
            aria-pressed={on}
            className="relative rounded-full px-2.5 py-1 focus-visible:outline-none"
            style={{ fontSize: 12, fontWeight: 600, color: on ? "var(--iz-accent)" : "var(--iz-ink-3)" }}
          >
            {on && (
              <motion.span
                layoutId="iz-lang-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--iz-accent-soft)", border: "1px solid var(--iz-accent)" }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
            )}
            <span className="relative">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
