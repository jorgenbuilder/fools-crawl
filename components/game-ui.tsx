import { Html } from "@react-three/drei";
import { GameMachine } from "../state/game";
import { useArbitraryStore } from "../state/zustand";

export default function GameUI() {
  const {
    state: {
      context: { health, shield, lastMonsterBlocked },
    },
  } = GameMachine.use();
  const { portrait } = useArbitraryStore();
  return (
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
        {shield > 0 && lastMonsterBlocked && <>({lastMonsterBlocked})</>}
      </div>
    </Html>
  );
}
