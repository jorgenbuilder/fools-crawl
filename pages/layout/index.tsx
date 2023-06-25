import gsap from "gsap";
import { Canvas, useFrame } from "@react-three/fiber";
import styles from "../../styles/Home.module.css";
import { FPS } from "../../components/fps";
import Cards, { Card } from "../../components/cards";
import { useEffect, useRef } from "react";
import { Animation, CardLayouts, GraphicsEntities } from "../../state/graphics";
import { GameEffects } from "../../state/game";
import { TarotDeck } from "../../state/TarotDeck";
import * as Game from "../../state/game";
import Camera from "../../components/camera";
import { useArbitraryStore } from "../../state/zustand";
import Escape from "../../components/escape";
import GameUI from "../../components/game-ui";

const card = GraphicsEntities.WithCard.entities[0];
const camera = GraphicsEntities.WithCamera.entities[0];
camera.position.z = 4;

const draw = TarotDeck.NewDeck();
const discard = draw.splice(0, 3);
const room = draw.splice(0, 4);

function Scene() {
  const { portrait } = useArbitraryStore();
  const cards = GraphicsEntities.WithCard.entities;

  useEffect(() => {
    Animation.OrganizeDrawPile(
      draw.map((x) => cards[x]),
      portrait,
      GraphicsEntities.WithCard.entities.length
    );
    Animation.OrganizeDiscardPile(
      discard.map((x) => cards[x]),
      portrait
    );
    Animation.OrganizeRoom(
      room.map((x) => cards[x]),
      portrait
    );
    Animation.MoveCamera(GraphicsEntities.WithCamera.entities[0], {
      position: GraphicsEntities.DefaultVec3.clone().set(
        0,
        0,
        portrait ? 5.25 : 4
      ),
      rotation: GraphicsEntities.DefaultEuler.clone().set(0, 0, 0),
    });
  }, [portrait]);
  return (
    <>
      <FPS />
      <Cards />
      <Camera />
      <Escape />
      <ambientLight intensity={0.5} />
    </>
  );
}

export default function Animations() {
  return (
    <div className={styles.container}>
      <GameUI />
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
