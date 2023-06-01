import React, { Suspense } from "react";
import { Html } from "@react-three/drei";
import { GameMachine } from "../state/game";
import Cards from "./cards";
import Title from "./title";
import Camera from "./camera";
import Lose from "./lose";
import Win from "./win";
import Escape from "./escape";
import { useArbitraryStore } from "../state/zustand";

const Scene = () => {
  const {
    state: {
      context: { health, shield, lastMonsterBlocked },
      matches,
    },
  } = GameMachine.use();
  const { portrait } = useArbitraryStore();
  return (
    <Suspense fallback={<></>}>
      <ambientLight intensity={0.5} />
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
