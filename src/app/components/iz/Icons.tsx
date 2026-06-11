import type { CSSProperties, ReactNode } from "react";

export interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * IZ icon set — a custom "duotone clay" style drawn for this app (no third-party
 * icon pack). Each glyph is a chunky rounded outline with a soft translucent fill
 * of the same currentColor, giving a friendly toy-like look that matches the
 * claymorphism UI. A path with `fill="currentColor" fillOpacity` gets both the
 * soft fill and the inherited stroke outline in one element.
 */
function Svg({
  size = 24,
  strokeWidth = 2,
  className,
  style,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const FILL = 0.22;

export const Home = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11 12 4.3 20 11v7.4A1.4 1.4 0 0 1 18.6 19.8H5.4A1.4 1.4 0 0 1 4 18.4Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M9.4 19.8v-5a1.1 1.1 0 0 1 1.1-1.1h3a1.1 1.1 0 0 1 1.1 1.1v5" />
  </Svg>
);

export const ArrowRight = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M4 12h14" />
    <path d="M12.5 6 19 12l-6.5 6" />
  </Svg>
);

export const ArrowUpRight = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M7 17 17 7" />
    <path d="M8.5 7H17v8.5" />
  </Svg>
);

export const MoveLeft = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M20 12H6" />
    <path d="M11.5 6 5 12l6.5 6" />
  </Svg>
);

/** Pulse / heartbeat wave */
export const Activity = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M3 12.5h3.3L9 6l3.4 12 2.4-8 1.7 3.5H21" />
  </Svg>
);

/** Two friends */
export const Users = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.3" fill="currentColor" fillOpacity={FILL} />
    <path d="M3.6 19c.5-3.6 2.8-5.4 5.4-5.4s4.9 1.8 5.4 5.4Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M16 5.4c1.7.4 2.9 1.9 2.9 3.6s-1.2 3.2-2.9 3.6" />
    <path d="M17.4 14.2c2 .8 3.3 2.4 3.7 4.6" />
  </Svg>
);

/** Aperture / lens — the emphasized tab */
export const Aperture = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" fill="currentColor" fillOpacity={FILL} />
    <path d="M12 3.6 9.2 8.5h8.1" />
    <path d="M20 8.4 14 10l4 6.6" />
    <path d="M16.6 19.7 11 16l-3.7 5.2" />
    <path d="M4 15.4 10 14 6 7.4" />
  </Svg>
);

/** Compass for quests */
export const Compass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" fill="currentColor" fillOpacity={FILL} />
    <path d="M15.4 8.6 13 13l-4.4 2.4L11 11Z" fill="currentColor" fillOpacity={FILL} />
  </Svg>
);

export const User = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.3" r="3.6" fill="currentColor" fillOpacity={FILL} />
    <path d="M5 20c.7-4.1 3.4-6.1 7-6.1s6.3 2 7 6.1Z" fill="currentColor" fillOpacity={FILL} />
  </Svg>
);

export const MapPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c4.4-4.1 6.7-7.6 6.7-10.7A6.7 6.7 0 0 0 5.3 10.3C5.3 13.4 7.6 16.9 12 21Z" fill="currentColor" fillOpacity={FILL} />
    <circle cx="12" cy="10.2" r="2.3" />
  </Svg>
);

export const Sun = (p: IconProps) => (
  <Svg strokeWidth={2.1} {...p}>
    <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity={FILL} />
    <path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
  </Svg>
);

export const Wind = (p: IconProps) => (
  <Svg strokeWidth={2.1} {...p}>
    <path d="M3 8.5h9a2.6 2.6 0 1 0-2.6-2.6" />
    <path d="M3 12.5h13.5a2.8 2.8 0 1 1-2.8 2.8" />
    <path d="M3 16.5h6.5" />
  </Svg>
);

export const Sparkles = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c.6 3.7 1.8 5.4 5 6-3.2.6-4.4 2.3-5 6-.6-3.7-1.8-5.4-5-6 3.2-.6 4.4-2.3 5-6Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M18.6 13.5c.3 1.7.9 2.4 2.4 2.7-1.5.3-2.1 1-2.4 2.7-.3-1.7-.9-2.4-2.4-2.7 1.5-.3 2.1-1 2.4-2.7Z" fill="currentColor" fillOpacity={FILL} />
  </Svg>
);

export const ChevronUp = (p: IconProps) => (
  <Svg strokeWidth={2.3} {...p}>
    <path d="M5.5 14.5 12 8.5l6.5 6" />
  </Svg>
);

/** Navigation arrow / paper plane */
export const Navigation = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 4 4.6 10.7c-.8.3-.7 1.4.1 1.6l6 1.9 1.9 6c.2.8 1.3.9 1.6.1L20 4Z" fill="currentColor" fillOpacity={FILL} />
  </Svg>
);

/** Ocean waves */
export const Waves = (p: IconProps) => (
  <Svg strokeWidth={2.1} {...p}>
    <path d="M2.5 7.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
    <path d="M2.5 12c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
    <path d="M2.5 16.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
  </Svg>
);

/** Reel / clapperboard */
export const Clapperboard = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.2h16v9.2a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 18.4Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M4.3 9.2 5.2 5l13.5 2.9-.4 1.3" />
    <path d="M9.6 6 8.4 8.9M14 6.9 12.8 9" />
  </Svg>
);

export const Quote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 7C6.6 8 5 10 5 13v4h5v-5H7.6c.1-1.8 1-2.9 2.7-3.4Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M19 7c-2.9 1-4.5 3-4.5 6v4h5v-5h-2.4c.1-1.8 1-2.9 2.7-3.4Z" fill="currentColor" fillOpacity={FILL} />
  </Svg>
);

/** Refresh / regenerate */
export const RefreshCw = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M20 11a8 8 0 0 0-13.7-4.5L4 8.5" />
    <path d="M4 4v4.5h4.5" />
    <path d="M4 13a8 8 0 0 0 13.7 4.5L20 15.5" />
    <path d="M20 20v-4.5h-4.5" />
  </Svg>
);

/** Sea shell */
export const Shell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c5 0 8.5-3.7 8.5-8.7C20.5 7.1 16.7 3 12 3S3.5 7.1 3.5 12.3C3.5 17.3 7 21 12 21Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M12 21V5M12 7 7.2 9.4M12 7l4.8 2.4M12 11l-6 3M12 11l6 3" />
  </Svg>
);

/** Winding road */
export const Route = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 20c-3 0-4-2-4-3.5S5 13 8 13s4-1 4-2.5S10.5 8 8 8 4 6.5 4 5" />
    <circle cx="6" cy="4.5" r="2" fill="currentColor" fillOpacity={FILL} />
    <circle cx="18" cy="19.5" r="2" fill="currentColor" fillOpacity={FILL} />
    <path d="M12 18h2.5c2 0 3.5-1 3.5-2.5" />
  </Svg>
);

export const Minus = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M5 12h14" />
  </Svg>
);

/** Award medal */
export const Award = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="5.3" fill="currentColor" fillOpacity={FILL} />
    <path d="M8.8 13.3 7.2 21l4.8-2.5L16.8 21l-1.6-7.7" />
  </Svg>
);

export const Camera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 8h2.7l1.3-2h7l1.3 2h2.7A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-8A1.5 1.5 0 0 1 4.5 8Z" fill="currentColor" fillOpacity={FILL} />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg strokeWidth={2.6} {...p}>
    <path d="M5 12.5 10 17 19 6.5" />
  </Svg>
);

/** Footprints / traces */
export const Footprints = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 5c1.3 0 2 1.2 2 2.8 0 1.4-.4 2.7-.4 4 0 1-.6 1.7-1.6 1.7S4.4 12.8 4.4 11.8c0-1.3-.4-2.6-.4-4C4 6.2 4.7 5 6 5Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M4.6 17.5c0-.9.6-1.4 1.5-1.4s1.5.5 1.5 1.4-.2 2-1.5 2-1.5-1.1-1.5-2Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M18 8c1.3 0 2 1.2 2 2.8 0 1.4-.4 2.7-.4 4 0 1-.6 1.7-1.6 1.7s-1.6-.7-1.6-1.7c0-1.3-.4-2.6-.4-4C16 9.2 16.7 8 18 8Z" fill="currentColor" fillOpacity={FILL} />
    <path d="M16.6 20.5c0-.9.6-1.4 1.5-1.4s1.5.5 1.5 1.4-.2 2-1.5 2-1.5-1.1-1.5-2Z" fill="currentColor" fillOpacity={FILL} />
  </Svg>
);

/** Copy / clipboard */
export const Copy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.6" fill="currentColor" fillOpacity={FILL} />
    <path d="M15.5 8.5V6.6A2.1 2.1 0 0 0 13.4 4.5H6.6A2.1 2.1 0 0 0 4.5 6.6v6.8A2.1 2.1 0 0 0 6.6 15.5h1.9" />
  </Svg>
);

/** Hashtag */
export const Hash = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 8.8h15M3.5 15.2h15" />
  </Svg>
);

/** Person pose / body */
export const Pose = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5.2" r="2.3" fill="currentColor" fillOpacity={FILL} />
    <path d="M12 7.6v6.4M12 14l-3.5 5.6M12 14l3.5 5.6M6.5 10.2 12 11.6l5.5-1.4" />
  </Svg>
);

/** Microphone */
export const Mic = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" fillOpacity={FILL} />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
    <path d="M12 17.5V21" />
    <path d="M8.5 21h7" />
  </Svg>
);

/** Close / X */
export const X = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Svg>
);

/** Crop / framing */
export const Crop = (p: IconProps) => (
  <Svg strokeWidth={2.1} {...p}>
    <path d="M6.5 3v12.5a1.5 1.5 0 0 0 1.5 1.5h12.5" />
    <path d="M3 6.5h12.5A1.5 1.5 0 0 1 17 8v12.5" />
  </Svg>
);
