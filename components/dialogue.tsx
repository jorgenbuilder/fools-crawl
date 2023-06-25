import { throttle } from "lodash";
import { useEffect, useState, useCallback } from "react";
import Dialogue from "../state/dialogue";
import Typewriter from "./typewriter";
import { Audio } from "../state/audio";
import { BsFillCaretDownFill } from "react-icons/bs";
import styles from "./dialogue.module.css";

/** Unlike most components, I decided to render this one outside of the canvas. */
export default function DialogueUI() {
  const { queue } = Dialogue.use();
  const [current] = queue;
  const [interrupt, setInterrupt] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setInterrupt(false);
    setComplete(false);
  }, [queue]);

  const handler = useCallback(() => {
    if (!complete && !interrupt) {
      setInterrupt(true);
    } else {
      Dialogue.use.setState({ queue: queue.slice(1) });
    }
  }, [queue, complete, interrupt]);

  // useEffect(() => {
  //   // Add global event listeners
  //   window.addEventListener('click', handler);
  //   window.addEventListener('keydown', handler);

  //   // Remove event listeners on cleanup
  //   return () => {
  //     window.removeEventListener('click', handler);
  //     window.removeEventListener('keydown', handler);
  //   };
  // }, []);

  return (
    current && (
      <div className={styles.overlay} onClick={() => handler()}>
        <dialog open={!!current} className={styles.dialogue}>
          <Typewriter
            string={current}
            interrupt={interrupt}
            onComplete={() => setComplete(true)}
            onType={throttle(() => Audio.PlaySound("tap"), 75)}
            delay={10}
            continueEl={
              <span className={styles.continue}>
                <BsFillCaretDownFill />
              </span>
            }
          />
        </dialog>
      </div>
    )
  );
}
