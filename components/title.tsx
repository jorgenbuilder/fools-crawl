import React from 'react';
import { useTexture } from '@react-three/drei';
import { useStateMachine } from '../state/machine';

export default function Title () {
  const title = useTexture('/title.png');
  const start = useTexture('/start.png');
  const { send } = useStateMachine()

  return (
    <group position={[0, 0, 1]}>
      <mesh scale={0.5}>
        <planeGeometry attach="geometry" args={[11, 1]} />
        <meshStandardMaterial attach="material" map={title} transparent={true} />
      </mesh>
      <mesh position={[0, -1, 0]} scale={0.25} onClick={() => send("NEW_GAME")}>
        <planeGeometry attach="geometry" args={[5, 1]} />
        <meshStandardMaterial attach="material" map={start} transparent={true} />
      </mesh>
    </group>
  );
};