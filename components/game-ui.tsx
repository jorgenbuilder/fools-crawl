import { GameMachine } from "../state/game";
import { useArbitraryStore } from "../state/zustand";
import { cn } from "./helper";
import { BsShieldFill, BsHeartFill } from "react-icons/bs";
import styles from "./game-ui.module.css";

export default function GameUI() {
  const {
    state: {
      context: { health, shield, lastMonsterBlocked },
    },
  } = GameMachine.use();
  const { portrait } = useArbitraryStore();
  return (
    <div className={cn(styles.gameUI, portrait && styles.portrait)}>
      <div className={styles.health}>
        <BsHeartFill className={styles.icon} />
        <div className={styles.value}>{health}</div>
      </div>
      <div className={styles.shield}>
        <BsShieldFill className={styles.icon} />
        <div className={styles.value}>
          {shield}
          {shield > 0 && lastMonsterBlocked && <>({lastMonsterBlocked})</>}
        </div>
      </div>
    </div>
  );
}
