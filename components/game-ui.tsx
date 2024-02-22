import { GameMachine } from "../state/game";
import { useArbitraryStore } from "../state/zustand";
import { cn } from "./helper";
import { BsShield, BsHeart } from "react-icons/bs";
import { PiSword } from "react-icons/pi";
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
      <div className={cn(styles.stat, styles.sword)}>
        <PiSword className={styles.icon} />
        <div className={styles.value}>{lastMonsterBlocked || "-"}</div>
      </div>
      <div className={cn(styles.stat, styles.shield)}>
        <BsShield className={styles.icon} />
        <div className={styles.value}>{shield}</div>
      </div>
      <div className={cn(styles.stat, styles.health)}>
        <BsHeart className={styles.icon} />
        <div className={styles.value}>{health}</div>
      </div>
    </div>
  );
}
