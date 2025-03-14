import React, { Suspense, useRef } from "react";
import { GameMachine } from "../state/game";
import Cards from "./cards";
import Title from "./title";
import Camera from "./camera";
import Lose from "./lose";
import Win from "./win";
import Escape from "./escape";
import Table from "./table";
import { useFrame } from "@react-three/fiber";

const Scene = () => {
  const {
    state: {
      context: { health, shield, lastMonsterBlocked },
      matches,
    },
  } = GameMachine.use();
  const lights = useRef<[THREE.PointLight, THREE.PointLight]>([null, null]);
  useFrame(({ clock: { elapsedTime } }) => {
    if (!lights.current[0]) return;
    lights.current[0].intensity =
      Math.sin(elapsedTime * 10) * 0.1 * Math.random() + 1;
    lights.current[1].intensity = Math.sin(elapsedTime + Math.PI / 4) * 0.5 + 1;
  });
  return (
    <Suspense fallback={<></>}>
      <ambientLight intensity={0.25} />
      <pointLight
        ref={(el) => (lights.current[0] = el)}
        decay={2}
        distance={50}
        intensity={1}
        position={[5, 2, 1]}
        color={0xffaa55}
      />
      <pointLight
        ref={(el) => (lights.current[1] = el)}
        decay={2}
        distance={50}
        intensity={1}
        position={[-3, -1, 1]}
        color={0xffaa55}
      />
      <Table />
      {matches("Dungeon.Win") && <Win />}
      {matches("Dungeon.GameOver") && <Lose />}
      {matches("Menu") && <Title />}
      {matches("Dungeon") && (
        <>
          {![matches("Dungeon.Win"), matches("Dungeon.GameOver")].includes(
            true
          ) && <Escape />}
        </>
      )}
      <Cards />
      <Camera />
    </Suspense>
  );
};

export default Scene;
