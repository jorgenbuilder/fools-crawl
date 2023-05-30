import React from "react";
import { useTexture } from "@react-three/drei";
import { GameMachine } from "../state/game";
import { useArbitraryStore } from "../state/zustand";

export default function Title() {
  const title = useTexture("/title.png");
  const start = useTexture("/start.png");
  const { send } = GameMachine.use();
  const { portrait } = useArbitraryStore();

  return (
    <group position={[0, 0, 1]}>
      <mesh
        scale={portrait ? 0.175 : 0.5}
        position={portrait ? [0, 1.75, 0] : [0, 0, 0]}
      >
        <planeGeometry attach="geometry" args={[11, 1]} />
        <meshStandardMaterial
          attach="material"
          map={title}
          transparent={true}
        />
      </mesh>
      <mesh
        position={portrait ? [0, -1.75, 0] : [0, -1, 0]}
        scale={0.25}
        onClick={() => send("NEW_GAME")}
      >
        <planeGeometry attach="geometry" args={[5, 1]} />
        <meshStandardMaterial
          attach="material"
          map={start}
          transparent={true}
        />
      </mesh>
    </group>
  );
}
