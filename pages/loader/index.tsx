import gsap from "gsap";
import { Canvas, useFrame } from "@react-three/fiber";
import styles from "../../styles/Home.module.css";
import { FPS } from "../../components/fps";
import { Card } from "../../components/cards";
import { useRef } from "react";
import { Animation, CardLayouts, GraphicsEntities } from "../../state/graphics";
import { GameEffects } from "../../state/game";
import { TarotDeck } from "../../state/TarotDeck";
import Camera from "../../components/camera";
import Loader from "../../components/loader";

if (GraphicsEntities.World.entities.length === 0) {
  GraphicsEntities.World.add({
    ...CardLayouts.DefaultCard(),
    card: TarotDeck.getTarotCard(13),
  });

  GameEffects.addCamera();
}

const card = GraphicsEntities.WithCard.entities[0];
const camera = GraphicsEntities.WithCamera.entities[0];

gsap.globalTimeline.clear();
gsap
  .timeline({ repeat: -1, repeatDelay: 1 })
  .add(Animation.ItemCardUse(card, 0, false, false));

function Scene() {
  const ref = useRef<THREE.Group>();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.copy(card.position);
    ref.current.rotation.copy(card.rotation);
    ref.current.rotation.y = 0;
  });
  return (
    <>
      <Loader />
      <ambientLight intensity={0.5} />
    </>
  );
}

export default function Animations() {
  return (
    <div className={styles.container}>
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
