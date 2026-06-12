import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "./i18n";

export type TranslateAction = {
  kind: "translate";
  originalText: string;
  originalLang: Lang;
  translatedText: string;
  targetLang: Lang;
};

const LANG_TO_LOCALE: Record<Lang, string> = {
  en: "en-US",
  ru: "ru-RU",
  kk: "kk-KZ",
};

const LANG_LABEL: Record<Lang, string> = {
  en: "EN",
  ru: "RU",
  kk: "KK",
};

type Round = {
  localText: string;
  touristText: string;
};

export function TranslateCard({
  action,
  labelKicker,
  labelSpeakToLocal,
  labelHandToLocal,
  labelListeningLocal,
  labelReplied,
  labelNewRound,
  labelErrorGeneric,
}: {
  action: TranslateAction;
  labelKicker: string;
  labelSpeakToLocal: string;
  labelHandToLocal: string;
  labelListeningLocal: string;
  labelReplied: string;
  labelNewRound: string;
  labelErrorGeneric: string;
}) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [mode, setMode] = useState<"idle" | "listening" | "translating" | "speaking">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
      recognitionRef.current = null;
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  const playTts = useCallback(async (text: string) => {
    if (!text) return;
    setMode("speaking");
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "Kore" }),
      });
      if (!res.ok) throw new Error("tts http " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = url;
      const el = audioRef.current;
      if (!el) {
        setMode("idle");
        return;
      }
      el.src = url;
      el.onended = () => setMode("idle");
      el.onerror = () => setMode("idle");
      await el.play();
    } catch {
      setErrorMsg(labelErrorGeneric);
      setMode("idle");
    }
  }, [labelErrorGeneric]);

  const handleSpeakToLocal = useCallback(() => {
    playTts(action.translatedText);
  }, [action.translatedText, playTts]);

  const handleHandToLocal = useCallback(() => {
    setErrorMsg(null);
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setErrorMsg(labelErrorGeneric);
      return;
    }
    const rec = new SR();
    rec.lang = LANG_TO_LOCALE[action.targetLang];
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = async (ev: any) => {
      const transcript: string =
        ev?.results?.[0]?.[0]?.transcript?.trim?.() || "";
      if (!transcript) {
        setMode("idle");
        return;
      }
      setMode("translating");
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: transcript,
            from: action.targetLang,
            to: action.originalLang,
          }),
        });
        if (!res.ok) throw new Error("translate http " + res.status);
        const data = await res.json();
        const back: string = String(data?.translated || "").trim();
        if (!back) throw new Error("empty");
        setRounds((prev) => [...prev, { localText: transcript, touristText: back }]);
        await playTts(back);
      } catch {
        setErrorMsg(labelErrorGeneric);
        setMode("idle");
      }
    };
    rec.onerror = () => {
      setMode("idle");
    };
    rec.onend = () => {
      if (mode === "listening") setMode("idle");
    };
    try {
      rec.start();
      recognitionRef.current = rec;
      setMode("listening");
    } catch {
      setErrorMsg(labelErrorGeneric);
      setMode("idle");
    }
  }, [action.originalLang, action.targetLang, labelErrorGeneric, mode, playTts]);

  return (
    <div
      className="mt-2 w-full max-w-[320px] overflow-hidden rounded-2xl px-4 py-3"
      style={{
        background:
          "linear-gradient(140deg, rgba(46,230,201,0.16), rgba(127,211,224,0.06))",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        color: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 11,
          opacity: 0.72,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {labelKicker}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.82, marginBottom: 4 }}>
        <span>{LANG_LABEL[action.originalLang]}</span>
        <span aria-hidden>→</span>
        <span>{LANG_LABEL[action.targetLang]}</span>
      </div>
      <div style={{ fontSize: 13, opacity: 0.78, marginBottom: 6 }}>
        {action.originalText}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginBottom: 12 }}>
        {action.translatedText}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSpeakToLocal}
          disabled={mode === "speaking" || mode === "listening" || mode === "translating"}
          className="rounded-full px-3 py-1.5 active:scale-95"
          style={{
            background: "var(--iz-accent)",
            color: "var(--iz-on-accent)",
            fontSize: 12,
            fontWeight: 600,
            opacity: mode === "speaking" || mode === "listening" || mode === "translating" ? 0.6 : 1,
            cursor: "pointer",
          }}
        >
          {labelSpeakToLocal}
        </button>
        <button
          onClick={handleHandToLocal}
          disabled={mode === "listening" || mode === "translating"}
          className="rounded-full px-3 py-1.5 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.12)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.22)",
            fontSize: 12,
            fontWeight: 600,
            opacity: mode === "listening" || mode === "translating" ? 0.6 : 1,
            cursor: "pointer",
          }}
        >
          {mode === "listening" ? labelListeningLocal : labelHandToLocal}
        </button>
      </div>

      {rounds.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {rounds.map((r, i) => (
            <div
              key={i}
              style={{
                padding: "8px 10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>
                {LANG_LABEL[action.targetLang]} · {labelReplied}
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>{r.localText}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>
                {LANG_LABEL[action.originalLang]}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.touristText}</div>
            </div>
          ))}
          <button
            onClick={handleHandToLocal}
            disabled={mode === "listening" || mode === "translating"}
            className="rounded-full px-3 py-1.5 active:scale-95"
            style={{
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {labelNewRound}
          </button>
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#fca5a5" }}>{errorMsg}</div>
      )}

      <audio ref={audioRef} hidden />
    </div>
  );
}
