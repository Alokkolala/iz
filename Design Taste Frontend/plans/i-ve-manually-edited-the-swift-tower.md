# IZ — Mangystau Social Travel App

## Context
Build "IZ", a premium **mobile-first** (390×844 / iPhone-style) web app prototype for Mangystau tourism. It is positioned as a *social travel companion* — explore with friends, track a crew on a map, and get AI "creative director" guidance for viral travel content. The full spec lives in `src/imports/pasted_text/iz-mangystau-tourism-app.md`.

The visual identity is coastal glassmorphism: Caspian Sea, pearl glass, wet sand, soft cyan/seafoam, shell pink, sunlight gold. Apple-level mobile polish, heavy but tasteful glass, calm immersive motion. Fully mock-data driven, clickable, demo-ready (no backend → PureFrontend, no Supabase).

## Foundations (design tokens & fonts)
- **Fonts** (`src/styles/fonts.css`): import Google Fonts at top of file. UI sans = **Inter**; editorial serif for hero moments = **Fraunces** (soft modern serif). Expose as CSS vars in `theme.css`.
- **Color tokens** (`src/styles/theme.css`): add an `:root` coastal palette as CSS custom properties (referenced everywhere, no scattered hex):
  - `--pearl #F7F9FB`, `--sand #EADFCB`, `--seafoam #BFE3E0`, `--cyan #7FD3E0`, `--caspian #1E5F8C` / deep `#0E3A5C`, `--shell-pink #F3C9C6`, `--gold #E8C77D`, plus text `#0E2230`.
  - Glass surface vars: `--glass-bg` (semi-transparent white), `--glass-border`.
- Keep existing shadcn tokens intact; only **add** new vars. Do not break theme.css structure.
- Large border radii (`rounded-[28px]`/`rounded-3xl`), `backdrop-blur-xl`, soft shadows.

## Architecture
Edit entrypoint `src/app/App.tsx` (default export). Create components under `src/app/components/iz/`:

- **App.tsx** — top-level state machine: `splash` → main app. Holds `activeTab` state (`pulse|crew|lens|quests|profile`), renders `AppShell`.
- **AppShell.tsx** — phone frame: centers a max-w ~`430px` column, `AnimatedBackground` behind, `AnimatePresence` to crossfade screens, `BottomNav` fixed at bottom. On desktop, render device-style centered frame so it always looks like a phone.
- **AnimatedBackground.tsx** — layered: slow-moving coastal gradient (CSS keyframes / motion), soft light blobs, subtle shell SVG pattern, drifting sand/salt particles (small absolutely-positioned motion dots). Respect `prefers-reduced-motion`.
- **BottomNav.tsx** — glass translucent tab bar, 5 tabs with lucide thin-line icons (Activity/Pulse, Users/Crew, Camera or Aperture/Lens, Compass or Trophy/Quests, User/Profile). **Lens** tab visually emphasized (raised center FAB-style, gold/cyan glow). Active state animated indicator. 44px+ hit targets.
- **GlassCard.tsx** — reusable frosted card: `backdrop-blur-xl`, glass bg/border, soft shadow, large radius, optional motion slide-up-with-blur-fade entrance.
- **SplashScreen.tsx** — full-screen Caspian gradient, abstract pearl "IZ" shell mark (custom SVG), serif headline "Leave your trace in Mangystau.", drifting particles, glassy CTA "Start trip" with subtle shine sweep animation.
- **TouristPulse.tsx** (Pulse) — greeting "Welcome to Mangystau", live counter card ("1,284 tourists exploring today" — animated count-up + gentle tick), three glass stat cards (Top spot: Bozzhyra / Best light: 18:40 / Caspian weather: Windy 24°C with lucide icons), mini map preview with glowing tourist dots, "Start Crew Mode" button (→ switches tab to crew). Cards stagger slide-up on enter.
- **CrewMap.tsx** (Crew) — stylized map background (gradient + abstract coastline/contour SVG, NOT a real map), 3–4 friend avatars floating with soft location pulses, selecting a friend shows a floating glass tooltip (name + status). Glass bottom sheet (expand/collapse, draggable-feel via motion) with crew name "Aqtau Trip Crew", status "3 nearby, 1 moving", "Set meet point" button. Useful/safe tone, not childish.
- **ViralShotAssistant.tsx** (Lens — the wow screen) — photo preview card (Unsplash coastal/desert image via `ImageWithFallback`, ES-module import), chips row: Pose / Angle / Light / Caption / Hashtags. "Generate shot plan" button → **loading scan animation** (sparkle + moving scan line over image) → reveals AI glass panel recommendations ("Stand 2 meters left", "Use 0.5x wide angle", "Face the sea, keep horizon low", "Best format: 7-sec Reel", "Caption: first signal from Mangystau 🐚"). Includes empty state before generating. Feels like a creative director.
- **QuestTrail.tsx** (Quests) — premium gamified mission cards (Catch the golden hour / Shell-frame photo / Road transition / Find the horizon line), each with soft icon, **progress ring** (SVG circle), reward badge. Badge shelf: Caspian Creator / Desert Scout / Shell Hunter. Elegant, not kiddie.
- **ProfileMini.tsx** (Profile) — compact profile: avatar, name, trip stats, earned badges, recent traces. Keeps the 5th tab real.

## Imagery
Use `mcp__plugin_make_unsplash__search_photos` for a small cohesive set (Caspian sea / Bozzhyra cliffs / desert horizon / coastline). Import each as an ES module binding and pass to `ImageWithFallback` (`object-cover`, meaningful `alt`). Used in Lens preview, Pulse top-spot, optional Quest cards. Keep the set consistent (same mood).

## Components reused
- `src/app/components/figma/ImageWithFallback.tsx` for all photos.
- shadcn `Button` (`src/app/components/ui/button.tsx`) as a base where it fits; custom-style glass buttons otherwise. `motion` (`motion/react`) for all transitions. `lucide-react` for icons.

## Motion principles
Slide-up + blur-fade for cards (staggered), slow water-like gradient drift, soft pulsing map dots, scan line on Lens, smooth bottom-sheet expand/collapse, native-feel tab crossfade via `AnimatePresence`. Tasteful, not overdone; honor reduced-motion.

## Accessibility
Semantic HTML, visible focus-visible rings, 44px+ targets, readable contrast for text over glass (use deep text color / scrims behind text on imagery), `alt` text, `prefers-reduced-motion` fallbacks.

## Verification
- App already runs on the Vite dev server (do not start it). After building, open the preview surface and confirm:
  1. Splash shows, "Start trip" enters the app.
  2. All 5 tabs switch with smooth transitions; Lens tab is emphasized.
  3. Lens "Generate shot plan" triggers scan animation → reveals suggestions.
  4. Crew: tapping a friend shows tooltip; bottom sheet expands.
  5. Layout stays phone-shaped and looks polished on desktop and mobile widths.
- Sanity-check no TypeScript/import errors in the editor diagnostics.
