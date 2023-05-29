import React from "react";
import { useTexture } from "@react-three/drei";
import Again from "./again";

export default function Win() {
  const win = useTexture("/win.png");

  return (
    <group position={[0, -0.25, 1]}>
      <mesh position={[0, 0.25, 0]} scale={0.5}>
        <planeGeometry attach="geometry" args={[7, 1]} />
        <meshStandardMaterial attach="material" map={win} transparent={true} />
      </mesh>
      <Again />
    </group>
  );
}
