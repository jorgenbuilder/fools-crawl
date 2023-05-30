import React, { Suspense } from "react";
import { Html } from "@react-three/drei";
import { useStore, world } from "../state/store";
import { useStateMachine } from "../state/machine";
import Cards from "./cards";
import Title from "./title";
import Camera from "./camera";
import Loader from "./loader";
import Lose from "./lose";
import Win from "./win";
import Escape from "./escape";

const Scene = () => {
  const { state } = useStateMachine();
  const [player] = world.with("player").entities;
  const { lastAttack, portrait } = useStore();
  return (
    <Suspense fallback={<Loader />}>
      <ambientLight intensity={0.5} />
      {state.matches("game.win") && <Win />}
      {state.matches("game.lose") && <Lose />}
      {state.matches("menu") && <Title />}
      {state.matches("game") && (
        <>
          <Html position={portrait ? [0, 2, 0] : [0, -1.5, 0]} center>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "24px",
                fontWeight: "bold",
                textShadow: "0 0 10px black",
              }}
            >
              ❤️&nbsp;{player?.player.health}&nbsp;🛡️&nbsp;
              {player?.player.shield}({lastAttack})
            </div>
          </Html>
          {![state.matches("game.win"), state.matches("game.lose")].includes(
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
