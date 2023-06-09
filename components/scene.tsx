import React, { Suspense, useRef } from "react";
import { Html } from "@react-three/drei";
import { GameMachine } from "../state/game";
import Cards from "./cards";
import Title from "./title";
import Camera from "./camera";
import Lose from "./lose";
import Win from "./win";
import Escape from "./escape";
import { useArbitraryStore } from "../state/zustand";
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
  const { portrait } = useArbitraryStore();
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
      {matches("GamePlay.Win") && <Win />}
      {matches("GamePlay.GameOver") && <Lose />}
      {matches("Menu") && <Title />}
      {matches("GamePlay") && (
        <>
          {!matches("GamePlay.Win") && (
            <Html position={portrait ? [0, 2, 0] : [0, -1.5, 0]} center>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "24px",
                  fontWeight: "bold",
                  textShadow: "0 0 10px black",
                }}
              >
                ❤️&nbsp;{health}&nbsp;🛡️&nbsp;
                {shield}
                {shield > 0 && lastMonsterBlocked && (
                  <>({lastMonsterBlocked})</>
                )}
              </div>
            </Html>
          )}
          {![matches("GamePlay.Win"), matches("GamePlay.GameOver")].includes(
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
