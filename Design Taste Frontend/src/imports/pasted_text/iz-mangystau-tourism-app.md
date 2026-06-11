Create a premium mobile-first web app called “IZ” for Mangystau tourism. It is not a regular travel guide. It is a social travel companion that helps tourists explore Mangystau with friends, track their crew on a map, and create beautiful Instagram/TikTok content with AI guidance.

The app must feel immersive, emotional, sea-inspired, and modern. The visual mood is: Caspian Sea, shells, wet sand, soft sunlight, pearl glass, coastal wind, minimal luxury, and light futuristic tourism. Use glassmorphism heavily but tastefully.

IMPORTANT:
This is a phone-first web app, like a PWA. Design everything for mobile screens first: 390x844 / iPhone-style layout. It should feel like a real app, not a desktop landing page. No desktop hero website layout. Use bottom navigation, swipe cards, floating panels, smooth transitions, and immersive full-screen sections.

STYLE DIRECTION:
- Color palette: pearl white, sand beige, seafoam blue, soft cyan, deep Caspian blue, shell pink, warm sunlight gold.
- Background: animated coastal gradient with subtle shell patterns, moving sea-light caustics, soft blurry water reflections.
- UI: frosted glass cards, blurred panels, translucent nav, subtle borders, soft shadows.
- Typography: elegant but modern. Use a clean sans-serif for UI and a soft editorial serif for hero moments.
- Icons: thin line icons, shell, wave, compass, camera, route, location pin, friends, sparkle.
- Avoid generic tourism-template design. No cheap stock-photo feeling. Make it feel like Apple-level mobile UI mixed with coastal glassmorphism.

APP STRUCTURE:
Create 5 main mobile screens:

1. Splash / Welcome Screen
- Full-screen animated Caspian sea gradient.
- A pearl shell logo or abstract “IZ” mark in the center.
- Text: “Leave your trace in Mangystau.”
- Small animated particles like sand/salt in the air.
- CTA button: “Start trip”
- Button should be glassy, rounded, with subtle shine animation.

2. Home / Tourist Pulse Screen
- Top greeting: “Welcome to Mangystau”
- Live counter card: “1,284 tourists exploring today”
- Small glass cards:
  - “Top spot now: Bozzhyra”
  - “Best light: 18:40”
  - “Caspian weather: Windy, 24°C”
- A mini map preview with glowing tourist dots.
- A “Start Crew Mode” button.
- Use animated cards that slide upward when entering the screen.

3. Crew Map Screen
- Full-screen map-inspired background, but stylized, not too detailed.
- Show 3–4 friend avatars floating on the map.
- Glass bottom sheet with:
  - Crew name: “Aqtau Trip Crew”
  - Friend status: “3 nearby, 1 moving”
  - Button: “Set meet point”
- Add animated location pulses.
- When selecting a friend, show a floating glass tooltip.
- Make this screen feel useful and safe, not childish.

4. Viral Shot Assistant Screen
This is the main wow screen.
- Camera/photo upload style interface.
- User sees a preview card of a location photo.
- AI glass panel gives recommendations:
  - “Stand 2 meters left”
  - “Use 0.5x wide angle”
  - “Face the sea, keep horizon low”
  - “Best format: 7-sec Reel”
  - “Caption: first signal from Mangystau 🐚”
- Add a “Generate shot plan” button.
- Add small chips: “Pose”, “Angle”, “Light”, “Caption”, “Hashtags”
- Make the AI feel like a creative director for travel content.
- Use subtle sparkle / scanning animation over the image.

5. Quests / Shell Trail Screen
- Gamified travel missions, but premium and clean.
- Cards:
  - “Catch the golden hour near the sea”
  - “Create a shell-frame photo”
  - “Shoot a road transition”
  - “Find the horizon line”
- Each quest card has a soft icon, progress ring, and reward badge.
- Badges:
  - “Caspian Creator”
  - “Desert Scout”
  - “Shell Hunter”
- This should not look like a kids game. It should feel like elegant social travel gamification.

NAVIGATION:
Use a bottom tab bar with glassmorphism:
- Pulse
- Crew
- Lens
- Quests
- Profile

The “Lens” tab should be visually emphasized because it is the core AI content feature.

ANIMATIONS:
Use smooth immersive transitions:
- Cards slide up with blur fade.
- Background gradient slowly moves like water.
- Shell particles drift subtly.
- Map dots pulse softly.
- AI scan line moves over photo preview.
- Bottom sheets expand/collapse smoothly.
- Tab transitions should feel native-app-like.
Use Framer Motion or CSS transitions.
Do not overdo animations. Keep everything premium and fluid.

INTERACTION REQUIREMENTS:
- The app should be clickable and demo-ready.
- Use mock data, no real backend needed.
- Use fake tourists, fake friends, fake weather, fake AI suggestions.
- Add realistic empty states and loading states.
- The photo upload can be mocked: when user taps “Generate shot plan”, show a loading scan animation and then reveal AI suggestions.
- The crew map can use mock coordinates and animated pins.

TECH REQUIREMENTS:
Build with React + TypeScript + Tailwind CSS.
Use Framer Motion for transitions.
Use Lucide icons.
Mobile-first responsive design.
Use component-based architecture:
- AppShell
- BottomNav
- GlassCard
- TouristPulse
- CrewMap
- ViralShotAssistant
- QuestTrail
- ProfileMini
- AnimatedBackground

DESIGN DETAILS:
- Border radius: large, soft, app-like.
- Glass cards: backdrop-blur-xl, semi-transparent white, subtle border.
- Use layered backgrounds: sea gradient + shell pattern + soft light blobs.
- Use realistic spacing. Do not overcrowd the screen.
- The app should feel expensive, calm, immersive, and memorable.
- Use microcopy that feels travel-native and social-media-native.

COPY STYLE:
Use short emotional phrases:
- “Leave your trace.”
- “Find your crew.”
- “Shoot the moment.”
- “Mangystau is live.”
- “Your next viral shot is 12 meters away.”
- “Best light starts in 24 minutes.”

FINAL RESULT:
Create a polished mobile web app prototype that looks like a real product ready for a hackathon demo. The first impression must be: “This is not a tourist catalog. This is a social media engine for Mangystau tourism.”