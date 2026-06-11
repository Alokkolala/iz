// src/app/components/iz/WaterDropButton.tsx
import { motion } from "motion/react";

interface WaterDropButtonProps {
  onClick: () => void;
  ariaLabel: string;
}

/**
 * Animated water-drop launcher for the bottom nav center slot.
 * - Liquid teardrop SVG body with gradient + gloss highlight.
 * - Breathing scale loop (1 -> 1.04 -> 1) at 3.2s ease-in-out, repeat infinite.
 * - Subtle outer aura that pulses opacity in sync.
 * - whileTap shrinks to 0.92; whileHover lifts to 1.06.
 * - Pure visual — owns no state, calls onClick on tap.
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
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(46,230,201,0.45)",
            "0 0 36px 8px rgba(46,230,201,0.32)",
            "0 0 0 0 rgba(46,230,201,0.45)",
          ],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="relative flex h-14 w-14 items-center justify-center"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
      >
        <svg viewBox="0 0 64 80" width={56} height={70} aria-hidden>
          <defs>
            <radialGradient id="drop-body" cx="50%" cy="58%" r="58%">
              <stop offset="0%" stopColor="#7fd3e0" stopOpacity="1" />
              <stop offset="55%" stopColor="#2ee6c9" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0b6b5e" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="drop-gloss" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M32 4 C 32 4, 8 36, 8 52 C 8 67, 19 76, 32 76 C 45 76, 56 67, 56 52 C 56 36, 32 4, 32 4 Z"
            fill="url(#drop-body)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
          />
          <ellipse cx="24" cy="40" rx="9" ry="14" fill="url(#drop-gloss)" opacity="0.55" />
          <circle cx="44" cy="58" r="2.5" fill="#ffffff" opacity="0.5" />
        </svg>
      </motion.span>
    </button>
  );
}
