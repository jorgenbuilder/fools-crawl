import React from "react";
import { useTexture } from "@react-three/drei";
import { useStateMachine } from "../state/machine";
import { useStore } from "../state/store";

export default function Again() {
  const start = useTexture("/again.png");
  const { send } = useStateMachine();
  const { portrait } = useStore();

  return (
    <group position={portrait ? [0, -1.25, 1] : [0, -0.25, 1]}>
      <mesh position={[0, 0, 0]} scale={0.125} onClick={() => send("NEW_GAME")}>
        <planeGeometry attach="geometry" args={[10, 1]} />
        <meshStandardMaterial
          attach="material"
          map={start}
          transparent={true}
        />
      </mesh>
    </group>
  );
}
