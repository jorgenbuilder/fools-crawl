import * as THREE from "three";
import React, { useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GameMachine } from "../state/game";
import { Animation, GraphicsEntities } from "../state/graphics";
import { useArbitraryStore } from "../state/zustand";
import { CardArt } from "../state/CardArt";

export default function Cards() {
  const { state, send } = GameMachine.use();
  const { portrait } = useArbitraryStore();

  useFrame(({ clock: { elapsedTime } }) => {
    if (state.matches("Menu")) {
      // Animation.DancingCards(elapsedTime, GraphicsEntities.WithCard, portrait);
    }
  });

  return (
    <>
      {GraphicsEntities.WithCard.entities.map((card, i) => (
        <Card
          card={card}
          key={`card-${card.card.index}`}
          onClick={() => send("FOLD_CARD", { index: i })}
        />
      ))}
    </>
  );
}

export function Card({
  card,
  fRef,
  onClick,
}: {
  card: GraphicsEntities.Card;
  fRef?: React.MutableRefObject<THREE.Group>;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const ref = useRef<THREE.Group>();
  const back = useTexture("/back2.png");
  const mask = useTexture("/mask.png");
  const front = CardArt.getTexture(card.card.index);

  const geometry = useRef(GraphicsEntities.CardGeometry.clone());

  // Update the card's position and rotation every frame
  useFrame(() => {
    if (!ref.current) return;
    geometry.current.attributes.position = card.geometry.attributes.position;
    geometry.current.attributes.position.needsUpdate = true;
    ref.current.rotation.copy(card.rotation);
    ref.current.position.copy(card.position);
  });

  return (
    <group
      ref={(el) => {
        ref.current = el;
        if (fRef) fRef.current = el;
      }}
      onClick={onClick}
    >
      <mesh geometry={geometry.current}>
        <meshStandardMaterial
          attach="material"
          map={back}
          side={THREE.BackSide}
          alphaMap={mask}
          transparent={true}
        />
      </mesh>
      <mesh geometry={geometry.current}>
        <meshStandardMaterial
          attach="material"
          map={front}
          side={THREE.FrontSide}
          color="white"
          alphaMap={mask}
          transparent={true}
        />
      </mesh>
    </group>
  );
}
