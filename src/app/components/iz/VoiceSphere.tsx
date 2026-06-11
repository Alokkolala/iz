import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Voice-reactive twin of the WaterSphere in StoneCanvas. Reads a live amplitude
 * (0..1) from a ref each frame and amplifies the wave displacement, rotation
 * speed and overall scale — so the bead "breathes" with the conversation.
 *
 * Using a ref (not a prop) keeps the audio loop and React rendering decoupled,
 * so we never re-render Three on every audio tick.
 */
interface VoiceSphereProps {
  amplitudeRef: MutableRefObject<number>;
}

function GradientEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 512;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#f4fbfd");
    g.addColorStop(0.32, "#cdeef0");
    g.addColorStop(0.55, "#7fd3e0");
    g.addColorStop(0.78, "#2f86a8");
    g.addColorStop(1, "#0e3a5c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 512);
    const sun = ctx.createRadialGradient(40, 70, 2, 40, 70, 60);
    sun.addColorStop(0, "rgba(255,255,255,0.95)");
    sun.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 128, 512);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromEquirectangular(tex).texture;
    scene.environment = env;

    tex.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

function ReactiveWaterSphere({ amplitudeRef }: VoiceSphereProps) {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 18), []);
  const base = useMemo(() => geo.attributes.position.clone(), [geo]);
  const smoothed = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // ease the raw amplitude so the surface doesn't twitch on every spike
    const target = Math.max(0, Math.min(1, amplitudeRef.current));
    smoothed.current += (target - smoothed.current) * 0.18;
    const amp = smoothed.current;

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    const waveBase = 0.05 + amp * 0.22;
    const speed = 1.4 + amp * 1.8;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(base, i);
      const wave =
        waveBase * Math.sin(v.x * 3 + t * speed) +
        waveBase * 0.9 * Math.sin(v.y * 4 + t * (speed * 0.72)) +
        waveBase * Math.sin(v.z * 3.4 + t * (speed * 1.15));
      const len = 1 + wave;
      pos.setXYZ(i, v.x * len, v.y * len, v.z * len);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    if (group.current) {
      group.current.rotation.y = t * (0.22 + amp * 0.35);
      group.current.position.y = Math.sin(t * 1.4) * 0.06 + amp * 0.04;
      const s = 1 + amp * 0.08;
      group.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial
          transmission={1}
          thickness={1.5}
          roughness={0.05}
          ior={1.333}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.08}
          color="#d6f1f8"
          attenuationColor="#37a6c6"
          attenuationDistance={2.4}
          envMapIntensity={1.5}
          iridescence={0.35}
          iridescenceIOR={1.3}
          specularIntensity={1}
        />
      </mesh>

      <mesh position={[-0.28, 0.34, 0.28]} scale={0.1}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.32, -0.18, 0.3]} scale={0.06}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function VoiceSphere({ amplitudeRef }: VoiceSphereProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-4, -1, -2]} intensity={0.6} color="#7fd3e0" />
      <pointLight position={[1.5, 2, 3]} intensity={1.2} color="#e8f6ff" />
      <GradientEnvironment />
      <ReactiveWaterSphere amplitudeRef={amplitudeRef} />
    </Canvas>
  );
}
