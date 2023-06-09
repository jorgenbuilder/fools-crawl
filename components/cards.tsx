import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GameMachine } from "../state/game";
import { Animation, GraphicsEntities } from "../state/graphics";
import { useArbitraryStore } from "../state/zustand";
import { CardArt } from "../state/TextureLoader";

export default function Cards() {
  const { state, send } = GameMachine.use();
  const { portrait } = useArbitraryStore();

  useFrame(({ clock: { elapsedTime } }) => {
    if (state.matches("Menu") || state.matches("GamePlay.Win")) {
      Animation.DancingCards(elapsedTime, GraphicsEntities.WithCard, portrait);
    } else if (state.matches("GamePlay.GameOver")) {
      Animation.DyingCards(GraphicsEntities.WithCard);
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
  const back = useTexture("/back.png");
  const front = CardArt.getTexture(card.card.index);
  const { state } = GameMachine.use();
  const { deck } = state.context;
  const i = deck.indexOf(card.card.index);

  // Update the card's position and rotation every frame
  useFrame(() => {
    if (!ref.current) return;
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
      <mesh>
        <planeGeometry attach="geometry" args={[1, 1.73]} />
        <meshStandardMaterial
          attach="material"
          map={back}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh>
        <planeGeometry attach="geometry" args={[1, 1.73]} />
        <meshStandardMaterial
          attach="material"
          map={front}
          side={THREE.FrontSide}
          color="white"
        />
      </mesh>
    </group>
  );
}
