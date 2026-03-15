"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, OrbitControls, Stage } from "@react-three/drei";
import * as THREE from "three";
import type { Group, Mesh } from "three";

const BASE = "https://raw.githubusercontent.com/kevanwee/kevanweeportfolio/master/public/Ica";
const ICA_GLB  = `${BASE}/Art_HyacineServant_00.glb`;
const BODY_TEX = `${BASE}/Textures/Servant_HyacineServant_00_Body_Color.png`;
const EYE1_TEX = `${BASE}/Textures/Servant_HyacineServant_00_Eye_Color_1.png`;
const EYE2_TEX = `${BASE}/Textures/Servant_HyacineServant_00_Eye_Color_2.png`;

function IcaModel() {
  const { scene } = useGLTF(ICA_GLB);
  const [bodyTex, eye1Tex, eye2Tex] = useTexture([BODY_TEX, EYE1_TEX, EYE2_TEX]);
  const ref = useRef<Group>(null);

  useEffect(() => {
    [bodyTex, eye1Tex, eye2Tex].forEach((t) => {
      t.flipY = false;
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    });

    scene.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const name = mesh.name.toLowerCase();
      if (name.includes("eye")) {
        mesh.material = new THREE.MeshBasicMaterial({
          map: name.includes("2") ? eye2Tex : eye1Tex,
          transparent: true,
          depthWrite: false,
        });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({
          map: bodyTex,
          roughness: 0.9,
          metalness: 0.05,
        });
      }
      (mesh.material as THREE.Material).needsUpdate = true;
    });
  }, [scene, bodyTex, eye1Tex, eye2Tex]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.06;
  });

  return <primitive ref={ref} object={scene} scale={0.04} />;
}

export default function IcaCanvas() {
  return (
    <Canvas style={{ width: "100%", height: "100%" }} gl={{ antialias: true, alpha: true }}>
      <Suspense fallback={null}>
        <Stage environment="dawn" intensity={0.7} adjustCamera={1.1} shadows={false}>
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
