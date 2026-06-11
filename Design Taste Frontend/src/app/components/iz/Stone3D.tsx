import { Component, Suspense, lazy, type ReactNode } from "react";

const StoneCanvas = lazy(() => import("./StoneCanvas"));

/** Glossy CSS water bead — lightweight stand-in for the WebGL sphere. */
function StoneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative h-[78%] w-[78%]" style={{ animation: "iz-bob 4s ease-in-out infinite" }}>
        {/* body */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 36% 30%, #ffffff 0%, #d6f1f8 18%, #8ed7ea 52%, #37a6c6 82%, #1e7fa0 100%)",
            boxShadow:
              "inset -10px -14px 24px rgba(14,58,92,0.35), inset 8px 10px 20px rgba(255,255,255,0.7), 0 16px 30px -10px rgba(30,110,150,0.6)",
          }}
        />
        {/* big specular highlight */}
        <div
          className="absolute rounded-full blur-[2px]"
          style={{ left: "22%", top: "16%", width: "30%", height: "24%", background: "radial-gradient(circle, rgba(255,255,255,0.95), transparent 70%)" }}
        />
        {/* small sparkle */}
        <div className="absolute rounded-full" style={{ left: "62%", top: "30%", width: "8%", height: "8%", background: "rgba(255,255,255,0.85)" }} />
        {/* bottom refraction glow */}
        <div
          className="absolute rounded-full blur-[3px]"
          style={{ left: "30%", bottom: "12%", width: "44%", height: "18%", background: "radial-gradient(ellipse, rgba(173,232,210,0.6), transparent 70%)" }}
        />
      </div>
    </div>
  );
}

class Stone3DBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface Stone3DProps {
  className?: string;
  withFace?: boolean;
  /** Render a GPU-cheap CSS water bead instead of a full WebGL canvas (use for small/secondary instances). */
  lite?: boolean;
}

export function Stone3D({ className = "", withFace = true, lite = false }: Stone3DProps) {
  if (lite) {
    return (
      <div className={className}>
        <StoneFallback />
      </div>
    );
  }
  return (
    <div className={className}>
      <Stone3DBoundary fallback={<StoneFallback />}>
        <Suspense fallback={<StoneFallback />}>
          <StoneCanvas withFace={withFace} />
        </Suspense>
      </Stone3DBoundary>
    </div>
  );
}
