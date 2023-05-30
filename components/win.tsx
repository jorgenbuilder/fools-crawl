import React from "react";
import { useTexture } from "@react-three/drei";
import Again from "./again";
import { useArbitraryStore } from "../state/zustand";

export default function Win() {
  const win = useTexture("/win.png");
  const { portrait } = useArbitraryStore();

  return (
    <group position={[0, -0.25, 1]}>
      <mesh
        position={portrait ? [0, 2, 0] : [0, 0.25, 0]}
        scale={portrait ? 0.25 : 0.5}
      >
        <planeGeometry attach="geometry" args={[7, 1]} />
        <meshStandardMaterial attach="material" map={win} transparent={true} />
      </mesh>
      <Again />
    </group>
  );
}
