import React from "react";
import { useTexture } from "@react-three/drei";
import { useStateMachine } from "../state/machine";
import { useStore } from "../state/store";

export default function Escape() {
  const escape = useTexture("/escape.png");
  const { send } = useStateMachine();
  const { portrait } = useStore();

  return (
    <group position={portrait ? [0, -2.25, 0] : [0, -1.125, 1]}>
      <mesh
        position={[0, 0.25, 0]}
        scale={0.125}
        onClick={() => send("ESCAPE")}
      >
        <planeGeometry attach="geometry" args={[6, 1]} />
        <meshStandardMaterial
          attach="material"
          map={escape}
          transparent={true}
        />
      </mesh>
    </group>
  );
}
