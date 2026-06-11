import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Builds a coastal sky→sea gradient environment (no network HDR) and assigns it
 * as the scene environment so the water sphere has real reflections/refractions.
 */
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
    // a soft "sun" highlight for a crisp specular
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

/** High-quality water sphere — animated living surface + glass/water transmission. */
function WaterSphere() {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 12), []);
  const base = useMemo(() => geo.attributes.position.clone(), [geo]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(base, i);
      const wave =
        0.05 * Math.sin(v.x * 3 + t * 1.5) +
        0.045 * Math.sin(v.y * 4 + t * 1.1) +
        0.05 * Math.sin(v.z * 3.4 + t * 1.8);
      const len = 1 + wave;
      pos.setXYZ(i, v.x * len, v.y * len, v.z * len);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    if (group.current) {
      group.current.rotation.y = t * 0.22;
      group.current.position.y = Math.sin(t * 1.4) * 0.06;
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

      {/* tiny inner air bubbles for depth */}
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

export default function StoneCanvas(_props: { withFace?: boolean }) {
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
      <WaterSphere />
    </Canvas>
  );
}
