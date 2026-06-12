// src/app/components/iz/WaterDropButton.tsx
import { motion } from "motion/react";

interface WaterDropButtonProps {
  onClick: () => void;
  ariaLabel: string;
}

/**
 * Water-sink launcher for the bottom-nav centre slot.
 *
 * This is the signature detail of the app. Rather than a static teardrop, the
 * affordance reads as a living pool of water sunk into the bar:
 *  - three concentric ripple rings emit outward, staggered, so the surface is
 *    always quietly moving (water sinks / surface tension).
 *  - the body itself wobbles between two soft ellipses (squash & stretch).
 *  - a specular shimmer slides slowly across the top, catching the light.
 *  - a soft caustic aura pulses behind everything for depth.
 *  - whileTap collapses the pool inward (-> a real liquid press feel).
 *
 * Pure visual — owns no state, calls onClick on tap.
 */
export function WaterDropButton({ onClick, ariaLabel }: WaterDropButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative -mt-7 flex h-16 w-16 items-center justify-center focus-visible:outline-none"
      style={{ touchAction: "manipulation" }}
    >
      {/* Caustic aura — slow opacity + box-shadow pulse for depth. */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(46,230,201,0.42)",
            "0 0 42px 10px rgba(46,230,201,0.36)",
            "0 0 0 0 rgba(46,230,201,0.42)",
          ],
          opacity: [0.78, 1, 0.78],
        }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Three concentric ripple rings — the heart of the "water sink" feel.
          Each ring expands from the pool edge and fades. Staggered so there's
          always one at every stage of its life cycle. */}
      {[0, 1.1, 2.2].map((delay, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: 56,
            height: 56,
            border: "1px solid rgba(127,211,224,0.55)",
            boxShadow: "0 0 14px rgba(46,230,201,0.25)",
          }}
          animate={{
            scale: [0.92, 1.32],
            opacity: [0.55, 0],
          }}
          transition={{
            duration: 3.3,
            delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Liquid body — wobbles between squashed and stretched ellipses.
          whileTap collapses it inward. whileHover lifts it slightly. */}
      <motion.span
        aria-hidden
        className="relative flex h-14 w-14 items-center justify-center"
        animate={{
          scaleX: [1, 1.04, 0.97, 1.02, 1],
          scaleY: [1, 0.96, 1.04, 0.98, 1],
        }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
      >
        <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden>
          <defs>
            {/* Water depth: bright cyan at top-left, deep teal at the bottom. */}
            <radialGradient id="sink-body" cx="38%" cy="32%" r="78%">
              <stop offset="0%" stopColor="#bff6ed" stopOpacity="1" />
              <stop offset="38%" stopColor="#2ee6c9" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#0a4d49" stopOpacity="1" />
            </radialGradient>
            {/* Top specular crescent. */}
            <linearGradient id="sink-gloss" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Sliding shimmer band. */}
            <linearGradient id="sink-shimmer" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Mask so shimmer only shows on the body. */}
            <clipPath id="sink-clip">
              <circle cx="32" cy="32" r="28" />
            </clipPath>
          </defs>

          {/* Body */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="url(#sink-body)"
            stroke="rgba(255,255,255,0.42)"
            strokeWidth="1.2"
          />

          {/* Top specular crescent */}
          <ellipse cx="26" cy="20" rx="13" ry="6" fill="url(#sink-gloss)" opacity="0.78" />

          {/* Sliding shimmer band — long thin highlight that orbits across
              the surface. Animated via motion on transform. */}
          <g clipPath="url(#sink-clip)">
            <motion.rect
              x={-30}
              y={26}
              width={36}
              height={12}
              rx={6}
              fill="url(#sink-shimmer)"
              animate={{ x: [-30, 64] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
            />
          </g>

          {/* Small pinpoint highlight bottom-right for refraction depth */}
          <circle cx="46" cy="44" r="2.2" fill="#ffffff" opacity="0.55" />

          {/* Tiny suspended droplet hint at the very top — it never actually
              falls, but it implies water surface tension. */}
          <motion.circle
            cx="32"
            cy="6"
            r="1.6"
            fill="#bff6ed"
            opacity="0.85"
            animate={{ cy: [6, 8, 6], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </motion.span>
    </button>
  );
}
