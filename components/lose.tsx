import React from "react";
import { useTexture } from "@react-three/drei";
import Again from "./again";

export default function Lose() {
  const lose = useTexture("/lose.png");

  return (
    <group position={[0, -0.25, 1]}>
      <mesh position={[0, 0.25, 0]} scale={0.5}>
        <planeGeometry attach="geometry" args={[8, 1]} />
        <meshStandardMaterial attach="material" map={lose} transparent={true} />
      </mesh>
      <Again />
    </group>
  );
}
