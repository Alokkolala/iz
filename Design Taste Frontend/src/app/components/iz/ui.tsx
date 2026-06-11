import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

/**
 * IZ liquid-glass primitive set — frosted translucent panels that refract the
 * fluid backdrop, with soft specular highlights and one vivid accent. Use these
 * everywhere so the whole app shares the Apple "liquid glass" feel.
 */

const tap = { type: "spring" as const, stiffness: 460, damping: 26 };
const GLASS_BLUR = "blur(var(--iz-blur)) saturate(160%)";

/* ---- Card -------------------------------------------------------------- */
export function Card({
  children,
  className = "",
  style,
  onClick,
  inset = false,
  flush = false,
}: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  inset?: boolean;
  flush?: boolean; // for media tiles: clip content, no glass
}) {
  if (flush) {
    return (
      <div onClick={onClick} className={className} style={{ borderRadius: "var(--iz-r-lg)", overflow: "hidden", border: "1px solid var(--iz-border)", boxShadow: "var(--iz-glass-shadow)", ...style }}>
        {children}
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: inset ? "var(--iz-glass-bg)" : "var(--iz-glass-bg-strong)",
        backdropFilter: GLASS_BLUR,
        WebkitBackdropFilter: GLASS_BLUR,
        border: "1px solid var(--iz-glass-border)",
        borderRadius: "var(--iz-r-lg)",
        boxShadow: inset ? "var(--iz-glass-hi)" : "var(--iz-glass-shadow), var(--iz-glass-hi)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---- Button ------------------------------------------------------------ */
type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  full = false,
  disabled = false,
  ariaLabel,
  className = "",
  style,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    borderRadius: "var(--iz-r-pill)",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: full ? "100%" : undefined,
    fontSize: size === "md" ? 15 : 13,
    padding: size === "md" ? "13px 20px" : "9px 15px",
  };
  const glass: CSSProperties = { backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR };
  const variants: Record<Variant, CSSProperties> = {
    primary: { background: "var(--iz-accent)", color: "var(--iz-on-accent)", boxShadow: "var(--iz-glow), var(--iz-glass-hi)" },
    secondary: { background: "var(--iz-glass-bg-strong)", color: "var(--iz-ink)", border: "1px solid var(--iz-glass-border)", boxShadow: "var(--iz-glass-hi)", ...glass },
    ghost: { background: "transparent", color: "var(--iz-ink-2)" },
  };

  return (
    <motion.button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.015 }}
      transition={tap}
      className={`focus-visible:outline-none disabled:opacity-50 ${className}`}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </motion.button>
  );
}

/* ---- IconChip ---------------------------------------------------------- */
export function IconChip({
  children,
  tone = "neutral",
  size = 36,
  className = "",
  style,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const accent = tone === "accent";
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.34),
        background: accent ? "var(--iz-accent-soft)" : "var(--iz-glass-bg-strong)",
        border: `1px solid ${accent ? "rgba(46,230,201,0.3)" : "var(--iz-glass-border)"}`,
        color: accent ? "var(--iz-accent)" : "var(--iz-ink-2)",
        boxShadow: "var(--iz-glass-hi)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ---- Overline (section label) ----------------------------------------- */
export function Overline({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <p className={className} style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--iz-ink-3)", fontWeight: 600, ...style }}>
      {children}
    </p>
  );
}
