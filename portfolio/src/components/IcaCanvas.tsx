"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Stage, OrbitControls } from "@react-three/drei";
import type { Group } from "three";

const ICA_GLB =
  "https://raw.githubusercontent.com/kevanwee/kevanweeportfolio/master/public/Ica/Art_HyacineServant_00.glb";

function IcaModel() {
  const { scene } = useGLTF(ICA_GLB);
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.06;
  });

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={0.04}
    />
  );
}

export default function IcaCanvas() {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Stage
          environment="dawn"
          intensity={0.7}
          adjustCamera={1.1}
          shadows={false}
        >
          <IcaModel />
        </Stage>
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}
