"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

const ICA_GLB =
  "https://raw.githubusercontent.com/kevanwee/kevanweeportfolio/master/public/Ica/Art_HyacineServant_00.glb";

function IcaModel() {
  const { scene } = useGLTF(ICA_GLB);
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    // gentle float
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    // slow spin
    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={0.04}
      position={[0, -0.6, 0]}
    />
  );
}

export default function IcaCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 3], fov: 35 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 2]} intensity={1.2} />
      <Suspense fallback={null}>
        <IcaModel />
        <Environment preset="dawn" />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={false}
      />
    </Canvas>
  );
}
