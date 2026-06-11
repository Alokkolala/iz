/** Living aqua-fluid backdrop — slow drifting color blobs the glass refracts over a near-black base. */
export function AnimatedBackground() {
  const blobs = [
    { c: "#2ee6c9", x: -18, y: -8, s: 320, d: 26, delay: 0, o: 0.30 },
    { c: "#1aa7c9", x: 58, y: 6, s: 300, d: 32, delay: -8, o: 0.26 },
    { c: "#3f6be0", x: 50, y: 64, s: 340, d: 30, delay: -16, o: 0.22 },
    { c: "#19c7ac", x: -14, y: 70, s: 280, d: 28, delay: -5, o: 0.24 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: "var(--iz-bg)" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.s,
            height: b.s,
            background: b.c,
            opacity: b.o,
            filter: "blur(80px)",
            animation: `iz-drift ${b.d}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
      {/* subtle darkening vignette so glass edges read */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(4,7,10,0.55) 100%)" }} />
    </div>
  );
}
