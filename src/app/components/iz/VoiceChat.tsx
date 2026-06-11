import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n, type Lang } from "./i18n";
import { X } from "./Icons";
import { Stone3D } from "./Stone3D";
import { useAuth } from "../../../lib/AuthProvider";

const VoiceSphere = lazy(() => import("./VoiceSphere"));

/**
 * Iz voice chat.
 *   STT  : browser Web Speech API (free)
 *   LLM  : OpenRouter (google/gemini-2.5-flash-lite) via /api/voice/chat
 *   TTS  : OpenRouter /api/v1/audio/speech (openai/gpt-4o-mini-tts) via
 *          /api/voice/tts — streamed back as MP3.
 *
 * Audio plumbing
 *   We share one AudioContext for the whole component. Mic uses a
 *   MediaStreamAudioSourceNode; the TTS MP3 plays through a hidden <audio>
 *   that's routed through a MediaElementAudioSourceNode → AnalyserNode →
 *   destination. `analyserRef` is swapped between mic / TTS depending on
 *   status — that's what makes the water bead breathe with the *actual*
 *   voice instead of a synthesised shimmer.
 *
 * State machine
 *   idle → tap bead → listening → (final transcript)
 *   → thinking (POST /api/voice/chat)
 *   → speaking (TTS streams + plays)
 *   → idle (auto-restart listening for natural turn-taking)
 *
 * Tap the bead at any time to interrupt the current step.
 */
type Status = "idle" | "listening" | "thinking" | "speaking" | "error";
type DirectionsAction = { kind: "directions"; destination: string; url: string };
type PlaceItem = {
  name: string;
  lat: number;
  lon: number;
  addr?: string | null;
  distance_km: number;
  url: string;
};
type PlacesAction = {
  kind: "places";
  category: string;
  items: PlaceItem[];
  embedUrl: string;
  listUrl: string;
  origin: { lat: number; lon: number };
};
type SightPhoto = { src: string; tip: string; attribution?: string; sourceUrl?: string; license?: string };
type SightAction = {
  kind: "sight";
  bucket: string;
  photos: SightPhoto[];
  routeUrl: string;
};
type WeatherAction = {
  kind: "weather";
  origin: { lat: number; lon: number };
  tempC: number;
  windKmh: number;
  code: number;
  label: string;
  sunrise: string | null;
  sunset: string | null;
  tomorrow: { maxC: number; minC: number; label: string };
};
type PlanAction = {
  kind: "plan";
  mood: string | null;
  origin: { lat: number; lon: number };
  blocks: { label: "sight" | "food" | "view"; items: Array<{ name?: string; tip?: string }> }[];
};
type Action = DirectionsAction | PlacesAction | SightAction | WeatherAction | PlanAction;
type Msg = {
  role: "user" | "assistant";
  text: string;
  action?: Action | null;
  suggestions?: string[];
};
type UserLocation = { lat: number; lon: number; place?: string };

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: "☕",
  restaurant: "🍽",
  fast_food: "🍔",
  bar: "🍸",
  fuel: "⛽",
  pharmacy: "💊",
  atm: "🏧",
  parking: "🅿️",
  supermarket: "🛒",
  hotel: "🏨",
  viewpoint: "🌄",
  attraction: "📍",
  museum: "🏛",
};

/* ---- chat-bubble pieces (ported from ChatUI reference, tuned for the
 * dark voice-overlay backdrop) -------------------------------------------- */
const bubbleEase = [0.16, 1, 0.3, 1] as const;

function Avatar() {
  return (
    <div className="relative h-7 w-7 shrink-0">
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: "var(--iz-accent)", opacity: 0.22, filter: "blur(8px)" }}
      />
      <Stone3D lite className="relative h-7 w-7" />
    </div>
  );
}

function MapPinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Dark-themed Leaflet mini-map with one numbered pin per place + a teal "you"
 * dot for the origin. Auto-fits bounds. Replaces the old OSM ?marker= iframe
 * which only supported a single huge pin and showed the "donate" footer.
 */
function MiniMap({
  origin,
  items,
  emoji,
}: {
  origin: { lat: number; lon: number };
  items: PlaceItem[];
  emoji: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Stable JSON signature so the effect doesn't tear down the map every render.
  const sig = JSON.stringify({
    o: [origin.lat, origin.lon],
    p: items.map((i) => [i.lat, i.lon, i.name]),
  });

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: "", // attribution shown elsewhere
      }).addTo(map);

      // Origin = small teal pulsing dot for "you"
      const youIcon = L.divIcon({
        className: "iz-you-dot",
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#2dd4bf;border:2px solid rgba(255,255,255,0.95);box-shadow:0 0 0 4px rgba(45,212,191,0.25),0 2px 6px rgba(0,0,0,0.5);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([origin.lat, origin.lon], { icon: youIcon, interactive: false }).addTo(map);

      // Each place = numbered emoji pin
      items.forEach((p, i) => {
        const pinHtml = `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#1f2937;border:2px solid #2dd4bf;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);"><div style="transform:rotate(45deg);font-size:13px;font-weight:700;color:#fff;line-height:1;">${i + 1}</div></div>`;
        const icon = L.divIcon({
          className: "iz-place-pin",
          html: pinHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 30],
        });
        const m = L.marker([p.lat, p.lon], { icon }).addTo(map!);
        m.bindTooltip(
          `<div style="font-size:12px;font-weight:600;color:#fff;">${i + 1}. ${p.name}</div><div style="font-size:11px;color:#cbd5e1;">${p.distance_km < 1 ? Math.round(p.distance_km * 1000) + " m" : p.distance_km + " km"}</div>`,
          { direction: "top", offset: [0, -28], opacity: 0.95 },
        );
      });

      // Fit to all points
      if (items.length) {
        const bounds = L.latLngBounds([
          [origin.lat, origin.lon],
          ...items.map((p) => [p.lat, p.lon] as [number, number]),
        ]);
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      } else {
        map.setView([origin.lat, origin.lon], 13);
      }
    })();
    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        map = null;
      }
    };
  }, [sig, emoji, origin.lat, origin.lon, items]);

  return <div ref={ref} style={{ width: "100%", height: 180, background: "#0b1220" }} />;
}

function PlacesCard({
  action,
  labelOpen,
  labelOpenAll,
  labelNone,
}: {
  action: PlacesAction;
  labelOpen: string;
  labelOpenAll: string;
  labelNone: string;
}) {
  const emoji = CATEGORY_EMOJI[action.category] || "📍";
  return (
    <div
      className="mt-2 w-full max-w-[320px] overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Dark Leaflet mini-map with all pins on it */}
      <div style={{ position: "relative", width: "100%" }}>
        <MiniMap origin={action.origin} items={action.items} emoji={emoji} />
        <a
          href={action.listUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1"
          style={{
            background: "rgba(8,30,52,0.85)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.18)",
            zIndex: 400,
          }}
        >
          <MapPinIcon size={11} />
          {labelOpenAll}
        </a>
        <div
          style={{
            position: "absolute",
            left: 6,
            bottom: 4,
            fontSize: 9,
            color: "rgba(255,255,255,0.45)",
            zIndex: 400,
            pointerEvents: "none",
          }}
        >
          © OSM · CARTO
        </div>
      </div>

      {/* list of places */}
      {action.items.length === 0 ? (
        <div
          className="px-3 py-3 text-center"
          style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}
        >
          {labelNone}
        </div>
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 220, overflowY: "auto" }}>
          {action.items.map((p, i) => (
            <a
              key={`${p.lat}-${p.lon}-${i}`}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 transition-colors"
              style={{
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(45,212,191,0.15)",
                  border: "1px solid rgba(45,212,191,0.5)",
                  color: "#5eead4",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>
                  {p.distance_km < 1
                    ? `${Math.round(p.distance_km * 1000)} m`
                    : `${p.distance_km} km`}
                  {p.addr ? ` · ${p.addr}` : ""}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--iz-accent)",
                  whiteSpace: "nowrap",
                }}
              >
                {labelOpen} ↗
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SightCard({
  action,
  labelRoute,
}: {
  action: SightAction;
  labelRoute: string;
}) {
  const title = action.bucket.charAt(0).toUpperCase() + action.bucket.slice(1);
  const photos = action.photos.slice(0, 6);
  return (
    <div
      className="mt-2 w-full max-w-[320px] overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* horizontal photo reel */}
      <div
        className="flex gap-2 overflow-x-auto px-3 py-3"
        style={{ scrollbarWidth: "none" }}
      >
        {photos.map((p, i) => (
          <a
            key={i}
            href={p.sourceUrl || p.src}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block shrink-0 overflow-hidden rounded-xl"
            style={{ width: 160, height: 200, background: "rgba(0,0,0,0.3)" }}
            title={p.tip}
          >
            <img
              src={p.src}
              alt={p.tip}
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: "8px 10px",
                background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.78))",
                color: "#fff",
                fontSize: 11,
                lineHeight: 1.3,
                fontWeight: 500,
              }}
            >
              {p.tip}
            </div>
          </a>
        ))}
      </div>
      {/* footer with title + route CTA */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            textTransform: "capitalize",
          }}
        >
          {title}
        </div>
        <a
          href={action.routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            background: "var(--iz-accent)",
            color: "var(--iz-on-accent)",
            fontSize: 11,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <MapPinIcon size={11} />
          {labelRoute}
        </a>
      </div>
    </div>
  );
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  // open-meteo returns "2026-06-12T05:14"
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "—";
  return `${m[1]}:${m[2]}`;
}

function WeatherCard({
  action,
  labelNow,
  labelTomorrow,
  labelWind,
  labelSunrise,
  labelSunset,
}: {
  action: WeatherAction;
  labelNow: string;
  labelTomorrow: string;
  labelWind: string;
  labelSunrise: string;
  labelSunset: string;
}) {
  return (
    <div
      className="mt-2 w-full max-w-[320px] overflow-hidden rounded-2xl px-4 py-3"
      style={{
        background:
          "linear-gradient(140deg, rgba(46,230,201,0.18), rgba(127,211,224,0.08))",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        color: "#fff",
      }}
    >
      <div className="flex items-end justify-between">
        <div>
          <div style={{ fontSize: 11, opacity: 0.72, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {labelNow}
          </div>
          <div className="flex items-baseline gap-2">
            <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1 }}>
              {action.tempC}°
            </div>
            <div style={{ fontSize: 13, opacity: 0.88 }}>{action.label}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.78, textAlign: "right", lineHeight: 1.5 }}>
          <div>
            {labelWind} {action.windKmh} km/h
          </div>
          <div>
            ↑ {formatTime(action.sunrise)} · ↓ {formatTime(action.sunset)}
          </div>
        </div>
      </div>
      <div
        className="mt-2 flex items-center justify-between"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.12)",
          paddingTop: 8,
          fontSize: 12,
          opacity: 0.88,
        }}
      >
        <span style={{ fontWeight: 600 }}>{labelTomorrow}</span>
        <span>
          {action.tomorrow.label} · {action.tomorrow.maxC}° / {action.tomorrow.minC}°
        </span>
      </div>
      {/* hidden a11y so the labels are referenced — keeps unused-var lint quiet */}
      <span aria-hidden style={{ display: "none" }}>
        {labelSunrise} {labelSunset}
      </span>
    </div>
  );
}

function DirectionsCard({
  action,
  labelOpen,
  labelTo,
}: {
  action: DirectionsAction;
  labelOpen: string;
  labelTo: string;
}) {
  return (
    <a
      href={action.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 transition-transform active:scale-95"
      style={{
        background: "var(--iz-accent)",
        color: "var(--iz-on-accent)",
        boxShadow: "0 6px 22px rgba(46,230,201,0.32)",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.2,
        textDecoration: "none",
      }}
    >
      <MapPinIcon size={14} />
      <span style={{ opacity: 0.85 }}>{labelTo}</span>
      <span>{action.destination}</span>
      <span
        aria-hidden
        style={{
          marginLeft: 4,
          paddingLeft: 8,
          borderLeft: "1px solid rgba(0,0,0,0.18)",
          opacity: 0.9,
          fontWeight: 500,
        }}
      >
        {labelOpen} ↗
      </span>
    </a>
  );
}

function PlanCard({ action }: { action: PlanAction }) {
  return (
    <div
      className="mt-2 w-full max-w-[320px] overflow-hidden rounded-2xl px-3 py-3"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div className="flex flex-col gap-3">
        {action.blocks.map((block) => (
          <div key={block.label}>
            <div
              className="mb-1 uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "rgba(94,234,212,0.86)",
                fontWeight: 700,
              }}
            >
              {block.label}
            </div>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {block.items.map((item, i) => (
                <div
                  key={`${block.label}-${i}`}
                  className="min-w-[140px] rounded-xl px-2.5 py-2"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 12,
                    lineHeight: 1.35,
                  }}
                >
                  {item.name || item.tip || "Mangystau"}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bubble({
  msg,
  isLast,
  onSuggestion,
  labelOpen,
  labelTo,
  labelOpenAll,
  labelNone,
  labelRoute,
  labelNow,
  labelTomorrow,
  labelWind,
  labelSunrise,
  labelSunset,
}: {
  msg: Msg;
  isLast: boolean;
  onSuggestion: (text: string) => void;
  labelOpen: string;
  labelTo: string;
  labelOpenAll: string;
  labelNone: string;
  labelRoute: string;
  labelNow: string;
  labelTomorrow: string;
  labelWind: string;
  labelSunrise: string;
  labelSunset: string;
}) {
  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: bubbleEase }}
        className="flex justify-end"
      >
        <div
          className="max-w-[82%] rounded-2xl rounded-br-md px-3.5 py-2"
          style={{
            background: "var(--iz-accent)",
            color: "var(--iz-on-accent)",
            boxShadow: "0 6px 22px rgba(46,230,201,0.28)",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {msg.text}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: bubbleEase }}
      className="flex items-end gap-2"
    >
      <Avatar />
      <div className="flex max-w-[82%] flex-col items-start">
        <div
          className="rounded-2xl rounded-bl-md px-3.5 py-2 backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#fff",
            fontSize: 14,
            lineHeight: 1.45,
          }}
        >
          {msg.text}
        </div>
        {msg.action?.kind === "directions" && (
          <DirectionsCard
            action={msg.action}
            labelOpen={labelOpen}
            labelTo={labelTo}
          />
        )}
        {msg.action?.kind === "places" && (
          <PlacesCard
            action={msg.action}
            labelOpen={labelOpen}
            labelOpenAll={labelOpenAll}
            labelNone={labelNone}
          />
        )}
        {msg.action?.kind === "sight" && (
          <SightCard action={msg.action} labelRoute={labelRoute} />
        )}
        {msg.action?.kind === "weather" && (
          <WeatherCard
            action={msg.action}
            labelNow={labelNow}
            labelTomorrow={labelTomorrow}
            labelWind={labelWind}
            labelSunrise={labelSunrise}
            labelSunset={labelSunset}
          />
        )}
        {msg.action?.kind === "plan" && <PlanCard action={msg.action} />}
        {isLast && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestion(s)}
                className="rounded-full px-3 py-1.5 transition-colors active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2"
    >
      <Avatar />
      <div
        className="flex items-center gap-1 rounded-2xl px-3.5 py-2.5 backdrop-blur-xl"
        style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.85)" }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

const LANG_TO_LOCALE: Record<Lang, string> = {
  en: "en-US",
  ru: "ru-RU",
  kk: "kk-KZ",
};

function Composer({
  onSubmit,
  onMic,
  status,
  placeholder,
  sendLabel,
  tapLabel,
}: {
  onSubmit: (text: string) => void;
  onMic: () => void;
  status: Status;
  placeholder: string;
  sendLabel: string;
  tapLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft("");
    onSubmit(trimmed);
  };
  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-10 flex items-center gap-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,30,52,0) 0%, rgba(8,30,52,0.78) 35%, rgba(8,30,52,0.95) 100%)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 rounded-full px-4 py-2.5 focus-visible:outline-none"
        style={{
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.22)",
          color: "#fff",
          fontSize: 14,
        }}
      />
      {draft.trim() ? (
        <button
          onClick={submit}
          aria-label={sendLabel}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: "var(--iz-accent)",
            color: "var(--iz-on-accent)",
            boxShadow: "0 6px 20px rgba(46,230,201,0.32)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12l14-7-7 14-2-5z" />
          </svg>
        </button>
      ) : (
        <button
          onClick={onMic}
          aria-label={tapLabel}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: status === "listening" ? "var(--iz-accent)" : "rgba(255,255,255,0.18)",
            color: status === "listening" ? "var(--iz-on-accent)" : "#fff",
            border: "1px solid rgba(255,255,255,0.22)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface VoiceChatProps {
  onClose: () => void;
}

export function VoiceChat({ onClose }: VoiceChatProps) {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const locationRef = useRef<UserLocation | null>(null);

  // amplitude written 60×/s, read by the WebGL sphere — never via React state
  const amplitudeRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // STT
  const recognitionRef = useRef<any>(null);

  // shared audio graph
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null); // currently active

  // mic graph
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);

  // TTS graph (one element + one MediaElementSource, reused across replies)
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const ttsSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null);
  const ttsUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<Status>("idle");
  const messagesRef = useRef<Msg[]>([]);
  const langRef = useRef<Lang>(lang);
  const closedRef = useRef(false);

  statusRef.current = status;
  messagesRef.current = messages;
  langRef.current = lang;

  // ask the browser for the user's coordinates once. If they decline, we
  // simply continue without — the LLM is told to ask for it when needed.
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        locationRef.current = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
      },
      () => {
        /* denied / unavailable — silent */
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // auto-scroll the chat to the latest bubble whenever it grows or status flips
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // ---- amplitude polling loop (writes amplitudeRef each frame) ----------
  useEffect(() => {
    const tick = () => {
      const s = statusRef.current;
      const an = analyserRef.current;
      if (an && (s === "listening" || s === "speaking")) {
        const buf = new Uint8Array(an.frequencyBinCount);
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // mic is quieter than the TTS playback bus; tune separately
        const gain = s === "speaking" ? 5 : 4;
        const target = Math.min(1, rms * gain);
        // light smoothing happens inside the sphere; here we just write raw
        amplitudeRef.current = target;
      } else if (s === "thinking") {
        const tt = performance.now() / 1000;
        amplitudeRef.current = 0.18 + 0.08 * Math.sin(tt * 2.4);
      } else {
        amplitudeRef.current = Math.max(0, amplitudeRef.current * 0.9);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [user?.id]);

  // ---- cleanup on unmount ----------------------------------------------
  useEffect(() => {
    return () => {
      closedRef.current = true;
      stopRecognition();
      stopMic();
      stopPlayback();
      ttsAbortRef.current?.abort();
      try {
        audioCtxRef.current?.close();
      } catch {}
      audioCtxRef.current = null;
      if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current);
        ttsUrlRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------
  // audio graph helpers
  // ---------------------------------------------------------------------
  const ensureAudioCtx = (): AudioContext | null => {
    if (!audioCtxRef.current) {
      const AC: typeof AudioContext =
        (window.AudioContext as typeof AudioContext) ||
        ((window as any).webkitAudioContext as typeof AudioContext);
      if (!AC) return null;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const ensureTtsGraph = (): AnalyserNode | null => {
    const ctx = ensureAudioCtx();
    const el = audioElRef.current;
    if (!ctx || !el) return null;
    if (!ttsSourceRef.current) {
      try {
        const src = ctx.createMediaElementSource(el);
        const an = ctx.createAnalyser();
        an.fftSize = 1024;
        src.connect(an);
        an.connect(ctx.destination);
        ttsSourceRef.current = src;
        ttsAnalyserRef.current = an;
      } catch {
        // already attached for another context — fine
      }
    }
    return ttsAnalyserRef.current;
  };

  // ---------------------------------------------------------------------
  // mic / STT
  // ---------------------------------------------------------------------
  const stopMic = () => {
    try {
      micSourceRef.current?.disconnect();
    } catch {}
    micSourceRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((tr) => tr.stop());
      micStreamRef.current = null;
    }
    if (analyserRef.current === micAnalyserRef.current) analyserRef.current = null;
    micAnalyserRef.current = null;
  };

  const startMic = async (): Promise<boolean> => {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (closedRef.current) {
        stream.getTracks().forEach((tr) => tr.stop());
        return false;
      }
      micStreamRef.current = stream;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      micSourceRef.current = src;
      micAnalyserRef.current = an;
      analyserRef.current = an;
      return true;
    } catch {
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
  }, [t]);

  // ---------------------------------------------------------------------
  // LLM round-trip + TTS playback
  // ---------------------------------------------------------------------
  const handleUserUtterance = useCallback(async (text: string) => {
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
      // Find the most recent assistant action so the server can inject memory
      // ("MEMORY OF YOUR LAST ACTION: …") and stop denying cards it just showed.
      const lastAssistantAction = [...messagesRef.current]
        .reverse()
        .find((m) => m.role === "assistant" && m.action)?.action ?? null;
      const res = await fetch("/api/voice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.text })),
          lang: langRef.current,
          location: locationRef.current,
          lastAction: lastAssistantAction,
          userId: user?.id ?? null,
        }),
      });
      if (!res.ok) throw new Error("network");
      const data = await res.json();
      const reply: string = (data?.text || "").trim();
      let action: Action | null = null;
      const a = data?.action;
      if (a && a.kind === "directions" && a.url) {
        action = {
          kind: "directions",
          destination: String(a.destination ?? ""),
          url: String(a.url),
        };
      } else if (a && a.kind === "places" && a.embedUrl) {
        action = {
          kind: "places",
          category: String(a.category ?? "attraction"),
          embedUrl: String(a.embedUrl),
          listUrl: String(a.listUrl ?? a.embedUrl),
          origin: a.origin ?? { lat: 0, lon: 0 },
          items: Array.isArray(a.items)
            ? a.items
                .filter((p: any) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon))
                .map((p: any) => ({
                  name: String(p.name ?? ""),
                  lat: Number(p.lat),
                  lon: Number(p.lon),
                  addr: p.addr ?? null,
                  distance_km: Number(p.distance_km ?? 0),
                  url: String(p.url ?? ""),
                }))
            : [],
        };
      } else if (a && a.kind === "sight" && Array.isArray(a.photos) && a.photos.length) {
        action = {
          kind: "sight",
          bucket: String(a.bucket ?? "mangystau"),
          routeUrl: String(a.routeUrl ?? ""),
          photos: a.photos
            .filter((p: any) => p && typeof p.src === "string")
            .map((p: any) => ({
              src: String(p.src),
              tip: String(p.tip ?? ""),
              attribution: p.attribution ?? undefined,
              sourceUrl: p.sourceUrl ?? undefined,
              license: p.license ?? undefined,
            })),
        };
      } else if (a && a.kind === "weather" && Number.isFinite(a.tempC)) {
        action = {
          kind: "weather",
          origin: a.origin ?? { lat: 0, lon: 0 },
          tempC: Number(a.tempC),
          windKmh: Number(a.windKmh ?? 0),
          code: Number(a.code ?? 0),
          label: String(a.label ?? ""),
          sunrise: a.sunrise ?? null,
          sunset: a.sunset ?? null,
          tomorrow: {
            maxC: Number(a.tomorrow?.maxC ?? 0),
            minC: Number(a.tomorrow?.minC ?? 0),
            label: String(a.tomorrow?.label ?? ""),
          },
        };
      } else if (a && a.kind === "plan" && Array.isArray(a.blocks)) {
        action = {
          kind: "plan",
          mood: typeof a.mood === "string" ? a.mood : null,
          origin: a.origin ?? { lat: 0, lon: 0 },
          blocks: a.blocks
            .filter((b: any) => b && Array.isArray(b.items))
            .map((b: any) => ({
              label: b.label === "food" || b.label === "view" ? b.label : "sight",
              items: b.items.map((it: any) => ({
                name: it?.name ? String(it.name) : undefined,
                tip: it?.tip ? String(it.tip) : undefined,
              })),
            })),
        };
      }
      const suggestions: string[] = Array.isArray(data?.suggestions)
        ? data.suggestions.filter((s: any) => typeof s === "string" && s.length).slice(0, 3)
        : [];
      if (closedRef.current) return;
      if (!reply) {
        setStatus("idle");
        return;
      }
      setMessages((cur) => [
        ...cur,
        { role: "assistant", text: reply, action, suggestions },
      ]);
      await playReply(reply);
    } catch (e: any) {
      if (closedRef.current) return;
      setErrorMsg(e?.message || "error");
      setStatus("idle");
    }
  }, []);

  const stopPlayback = () => {
    const el = audioElRef.current;
    if (el) {
      try {
        el.pause();
        el.removeAttribute("src");
        el.load();
      } catch {}
    }
    if (analyserRef.current === ttsAnalyserRef.current) analyserRef.current = null;
  };

  const playReply = useCallback(async (text: string) => {
    const el = audioElRef.current;
    if (!el) {
      setStatus("idle");
      return;
    }
    // cancel any previous in-flight TTS
    ttsAbortRef.current?.abort();
    const ctrl = new AbortController();
    ttsAbortRef.current = ctrl;

    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: langRef.current }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const blob = await res.blob();
      if (closedRef.current || ctrl.signal.aborted) return;

      // swap to the new blob URL, revoking the previous one
      const url = URL.createObjectURL(blob);
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
      ttsUrlRef.current = url;

      // make sure the audio graph is wired before play (autoplay-safe — we
      // arrived here via a user gesture on the bead)
      const an = ensureTtsGraph();
      if (an) analyserRef.current = an;

      el.src = url;
      el.onplay = () => {
        if (!closedRef.current) setStatus("speaking");
      };
      el.onended = () => {
        if (closedRef.current) return;
        if (analyserRef.current === ttsAnalyserRef.current) analyserRef.current = null;
        setStatus("idle");
        // natural turn-taking: reopen the mic after a tiny gap
        window.setTimeout(() => {
          if (!closedRef.current && statusRef.current === "idle") startListening();
        }, 360);
      };
      el.onerror = () => {
        if (!closedRef.current) setStatus("idle");
      };
      await el.play();
    } catch (e: any) {
      if (ctrl.signal.aborted || closedRef.current) return;
      setErrorMsg("TTS failed");
      setStatus("idle");
    }
  }, [startListening]);

  // ---------------------------------------------------------------------
  // interactions
  // ---------------------------------------------------------------------
  const onBeadTap = () => {
    // user gesture — kick the AudioContext alive for later TTS playback
    ensureAudioCtx();

    if (status === "listening") {
      stopRecognition();
      stopMic();
      setStatus("idle");
      return;
    }
    if (status === "speaking") {
      ttsAbortRef.current?.abort();
      stopPlayback();
      setStatus("idle");
      return;
    }
    if (status === "thinking") return;
    startListening();
  };

  const handleClose = () => {
    closedRef.current = true;
    stopRecognition();
    stopMic();
    stopPlayback();
    ttsAbortRef.current?.abort();
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
      {/* hidden audio element — TTS playback target. Lives inside the
          component so the MediaElementSource binds once and survives every
          subsequent reply. */}
      <audio ref={audioElRef} preload="auto" hidden />

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
      <div className="relative flex flex-col items-center justify-center px-5 pt-1">
        <motion.button
          onClick={onBeadTap}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          aria-label={t("voice_tap_to_talk")}
          className="relative flex items-center justify-center focus-visible:outline-none"
          style={{ width: 140, height: 140 }}
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: `0 0 60px 16px ${auraColor}`,
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
          className="mt-2 text-center"
          style={{
            fontSize: 12,
            color: errorMsg ? "rgba(255,180,180,0.95)" : "rgba(255,255,255,0.85)",
            fontWeight: 500,
            minHeight: 16,
          }}
        >
          {statusLabel}
        </p>
      </div>

      {/* Chat */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pb-4 pt-3"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="mx-auto flex max-w-[360px] flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <Bubble
                key={`${i}-${m.role}-${m.text.slice(0, 12)}`}
                msg={m}
                isLast={i === messages.length - 1 && status !== "thinking"}
                onSuggestion={handleUserUtterance}
                labelOpen={t("voice_open_maps")}
                labelTo={t("voice_route_to")}
                labelOpenAll={t("voice_open_all")}
                labelNone={t("voice_none_nearby")}
                labelRoute={t("voice_route_btn")}
                labelNow={t("voice_now")}
                labelTomorrow={t("voice_tomorrow")}
                labelWind={t("voice_wind")}
                labelSunrise={t("voice_sunrise")}
                labelSunset={t("voice_sunset")}
              />
            ))}
            {status === "thinking" && <TypingRow key="typing" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Composer — sticky text input + mic */}
      <Composer
        onSubmit={handleUserUtterance}
        onMic={onBeadTap}
        status={status}
        placeholder={t("voice_compose_placeholder")}
        sendLabel={t("voice_send")}
        tapLabel={t("voice_tap_to_talk")}
      />
    </motion.div>
  );
}
