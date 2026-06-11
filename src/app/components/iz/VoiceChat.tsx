import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n, type Lang } from "./i18n";
import { X } from "./Icons";

const VoiceSphere = lazy(() => import("./VoiceSphere"));

/**
 * Iz voice chat — Web Speech API (free, in-browser) for STT and TTS, OpenRouter
 * for the LLM via /api/voice/chat. The water bead in the centre breathes with
 * live audio amplitude (mic when listening, procedural shimmer when speaking)
 * so the avatar feels like it's actually in the conversation.
 *
 * State machine:
 *   idle  → user taps bead → listening
 *   listening → final transcript → thinking (POST)
 *   thinking → reply text → speaking (TTS)
 *   speaking → utterance end → listening (auto turn-taking)
 *
 * Tap the bead at any time to interrupt.
 */
type Status = "idle" | "listening" | "thinking" | "speaking" | "error";
type Msg = { role: "user" | "assistant"; text: string };

const LANG_TO_LOCALE: Record<Lang, string> = {
  en: "en-US",
  ru: "ru-RU",
  kk: "kk-KZ",
};

interface VoiceChatProps {
  onClose: () => void;
}

export function VoiceChat({ onClose }: VoiceChatProps) {
  const { lang, t } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // refs that survive renders without re-triggering effects
  const amplitudeRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<Status>("idle");
  const messagesRef = useRef<Msg[]>([]);
  const langRef = useRef<Lang>(lang);
  const closedRef = useRef(false);

  statusRef.current = status;
  messagesRef.current = messages;
  langRef.current = lang;

  // ---- audio amplitude loop (drives the sphere) -------------------------
  useEffect(() => {
    const tick = () => {
      const s = statusRef.current;
      if (analyserRef.current && s === "listening") {
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        amplitudeRef.current = Math.min(1, rms * 4);
      } else if (s === "speaking") {
        // SpeechSynthesis doesn't expose its output stream — synth a shimmer.
        const tt = performance.now() / 1000;
        amplitudeRef.current =
          0.32 + 0.22 * Math.abs(Math.sin(tt * 4.1)) + 0.16 * Math.abs(Math.sin(tt * 7.3));
      } else if (s === "thinking") {
        const tt = performance.now() / 1000;
        amplitudeRef.current = 0.18 + 0.1 * Math.sin(tt * 2.4);
      } else {
        amplitudeRef.current = Math.max(0, amplitudeRef.current * 0.9);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ---- cleanup on unmount ----------------------------------------------
  useEffect(() => {
    return () => {
      closedRef.current = true;
      stopRecognition();
      stopMic();
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  // some browsers populate voices async — trigger a load so they're ready
  useEffect(() => {
    try {
      window.speechSynthesis.getVoices();
    } catch {}
  }, []);

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((tr) => tr.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (closedRef.current) {
        stream.getTracks().forEach((tr) => tr.stop());
        return false;
      }
      micStreamRef.current = stream;
      const AC: typeof AudioContext =
        (window.AudioContext as typeof AudioContext) ||
        ((window as any).webkitAudioContext as typeof AudioContext);
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      analyserRef.current = analyser;
      return true;
    } catch (e: any) {
      setErrorMsg(t("voice_mic_denied"));
      return false;
    }
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
  };

  const handleUserUtterance = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setStatus("idle");
        return;
      }
      const next: Msg[] = [...messagesRef.current, { role: "user", text: trimmed }];
      setMessages(next);
      setStatus("thinking");
      stopMic();

      try {
        const res = await fetch("/api/voice/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map((m) => ({ role: m.role, content: m.text })),
            lang: langRef.current,
          }),
        });
        if (!res.ok) throw new Error("network");
        const data = await res.json();
        const reply: string = (data?.text || "").trim();
        if (closedRef.current) return;
        if (!reply) {
          setStatus("idle");
          return;
        }
        setMessages((cur) => [...cur, { role: "assistant", text: reply }]);
        speakReply(reply);
      } catch (e: any) {
        if (closedRef.current) return;
        setErrorMsg(e?.message || "error");
        setStatus("idle");
      }
    },
    []
  );

  const speakReply = useCallback((text: string) => {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const wanted = LANG_TO_LOCALE[langRef.current];
    u.lang = wanted;
    // pick best matching voice; kk is often missing → fall back to ru
    const voices = window.speechSynthesis.getVoices?.() || [];
    const fallback = langRef.current === "kk" ? "ru-RU" : wanted;
    const pick =
      voices.find((v) => v.lang === wanted) ||
      voices.find((v) => v.lang.startsWith(wanted.slice(0, 2))) ||
      voices.find((v) => v.lang === fallback) ||
      null;
    if (pick) u.voice = pick;
    u.rate = 1.02;
    u.pitch = 1.0;
    u.onstart = () => {
      if (!closedRef.current) setStatus("speaking");
    };
    u.onend = () => {
      if (closedRef.current) return;
      setStatus("idle");
      // keep the conversation flowing — auto reopen the mic shortly after
      window.setTimeout(() => {
        if (!closedRef.current && statusRef.current === "idle") startListening();
      }, 380);
    };
    u.onerror = () => {
      if (!closedRef.current) setStatus("idle");
    };
    window.speechSynthesis.speak(u);
  }, []);

  const startListening = useCallback(async () => {
    if (closedRef.current) return;
    setErrorMsg(null);
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setErrorMsg(t("voice_no_support"));
      setStatus("error");
      return;
    }
    const ok = await startMic();
    if (!ok || closedRef.current) return;
    const rec = new SR();
    rec.lang = LANG_TO_LOCALE[langRef.current];
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: any) => {
      const transcript: string =
        ev?.results?.[0]?.[0]?.transcript?.trim?.() || "";
      handleUserUtterance(transcript);
    };
    rec.onerror = (ev: any) => {
      const err = ev?.error || "rec_error";
      if (err === "no-speech" || err === "aborted") {
        setStatus("idle");
      } else {
        setErrorMsg(String(err));
        setStatus("idle");
      }
    };
    rec.onend = () => {
      if (statusRef.current === "listening") setStatus("idle");
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setStatus("listening");
    } catch (e: any) {
      setErrorMsg(String(e?.message ?? e));
      setStatus("idle");
    }
  }, [handleUserUtterance, t]);

  const onBeadTap = () => {
    if (status === "listening") {
      stopRecognition();
      stopMic();
      setStatus("idle");
      return;
    }
    if (status === "speaking") {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      setStatus("idle");
      return;
    }
    if (status === "thinking") return; // can't interrupt the network call cleanly
    startListening();
  };

  const handleClose = () => {
    closedRef.current = true;
    stopRecognition();
    stopMic();
    try {
      window.speechSynthesis.cancel();
    } catch {}
    onClose();
  };

  const statusLabel =
    errorMsg ||
    (status === "listening"
      ? t("voice_listening")
      : status === "thinking"
      ? t("voice_thinking")
      : status === "speaking"
      ? t("voice_speaking")
      : t("voice_tap_to_talk"));

  // status-driven aura glow
  const auraColor =
    status === "listening"
      ? "rgba(46,230,201,0.55)"
      : status === "speaking"
      ? "rgba(127,211,224,0.55)"
      : status === "thinking"
      ? "rgba(255,255,255,0.32)"
      : "rgba(127,211,224,0.28)";

  return (
    <motion.div
      key="voice-chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="absolute inset-0 z-40 flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,30,52,0.78) 0%, rgba(8,30,52,0.62) 50%, rgba(8,30,52,0.86) 100%)",
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
            }}
          >
            {t("voice_kicker")}
          </p>
          <p
            className="font-display"
            style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}
          >
            {t("voice_title")}
          </p>
        </div>
        <button
          onClick={handleClose}
          aria-label={t("voice_close")}
          className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none"
          style={{
            background: "rgba(255,255,255,0.16)",
            border: "1px solid rgba(255,255,255,0.22)",
            color: "#fff",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Sphere stage */}
      <div className="relative flex flex-col items-center justify-center px-5 pt-3">
        <motion.button
          onClick={onBeadTap}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          aria-label={t("voice_tap_to_talk")}
          className="relative flex items-center justify-center focus-visible:outline-none"
          style={{ width: 240, height: 240 }}
        >
          {/* soft aura */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: `0 0 80px 20px ${auraColor}`,
              scale: status === "listening" || status === "speaking" ? [1, 1.04, 1] : 1,
            }}
            transition={{
              boxShadow: { duration: 0.6 },
              scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
            }}
          />
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <VoiceSphere amplitudeRef={amplitudeRef} />
            </Suspense>
          </div>
        </motion.button>

        <p
          className="mt-5 text-center"
          style={{
            fontSize: 14,
            color: errorMsg ? "rgba(255,180,180,0.95)" : "rgba(255,255,255,0.92)",
            fontWeight: 500,
            minHeight: 20,
          }}
        >
          {statusLabel}
        </p>
        {messages.length === 0 && !errorMsg && (
          <p
            className="mt-1 max-w-[280px] text-center"
            style={{ fontSize: 12, color: "rgba(255,255,255,0.62)" }}
          >
            {t("voice_intro_hint")}
          </p>
        )}
      </div>

      {/* Transcript */}
      <div
        className="flex-1 overflow-y-auto px-5 pb-28 pt-6"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="mx-auto flex max-w-[360px] flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {messages.slice(-8).map((m, i) => (
              <motion.div
                key={`${i}-${m.role}-${m.text.slice(0, 8)}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`max-w-[86%] rounded-2xl px-3.5 py-2 ${
                  m.role === "user" ? "self-end" : "self-start"
                }`}
                style={
                  m.role === "user"
                    ? {
                        background: "rgba(46,230,201,0.92)",
                        color: "#062a26",
                        fontWeight: 500,
                        fontSize: 14,
                      }
                    : {
                        background: "rgba(255,255,255,0.16)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.22)",
                        fontSize: 14,
                      }
                }
              >
                {m.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
