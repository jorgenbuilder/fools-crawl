import React from "react";
import { Html, useTexture } from "@react-three/drei";
import { GameMachine } from "../state/game";
import { useArbitraryStore } from "../state/zustand";

export default function Title() {
  const title = useTexture("/title.png");
  const start = useTexture("/start.png");
  const { send } = GameMachine.use();
  const { portrait } = useArbitraryStore();

  return (
    <group position={[0, 0, 1]}>
      <mesh
        scale={portrait ? 0.175 : 0.5}
        position={portrait ? [0, 1.75, 0] : [0, 0, 0]}
      >
        <planeGeometry attach="geometry" args={[11, 1]} />
        <meshStandardMaterial
          attach="material"
          map={title}
          transparent={true}
        />
      </mesh>
      <mesh
        position={portrait ? [0, -1.75, 0] : [0, -1, 0]}
        scale={0.25}
        onClick={() => send("NEW_GAME")}
      >
        <planeGeometry attach="geometry" args={[5, 1]} />
        <meshStandardMaterial
          attach="material"
          map={start}
          transparent={true}
        />
      </mesh>
      <Html position={portrait ? [0, -2.125, 0] : [0, -1.5, 0]} center>
        <div
          style={{
            color: "white",
            width: 200,
            fontSize: 24,
            textAlign: "center",
            textShadow: "0 0 10px black",
            cursor: "pointer",
          }}
          onClick={() => document.querySelector("dialog").showModal()}
        >
          How to Play
        </div>
        <dialog style={{ maxWidth: "400px" }}>
          <h2>HOW TO PLAY</h2>

          <p>
            A deck of tarot cards, major arcana removed, is a dungeon. Shuffle
            the deck and draw 4 cards, display them before you, this is a room.
            A room ends when all the cards are folded.
          </p>

          <h3>Cups: Potions</h3>

          <p>
            A potion gives you health points equal to its value, up to a maximum
            of 21 health points.
          </p>

          <p>
            Drinking multiple potions in a row will make you sick and result in
            no extra healing, only the first potion&apos;s value will be gained
            in HP. Potions are equal to their value and face cards (Page,
            Knight, Queen, King) each are equal to 11.
          </p>

          <h3>Pentacles: Shields</h3>

          <p>
            A shield absorbs the damage difference between the shield value and
            that of the attacked monster&apos;s value.
          </p>

          <p>
            Shields can only defend against monsters in descending value and if
            you use a shield on a monster with higher or equal value to the
            previous, it will break. Broken shields leave you unarmored, and
            taking full damage.
          </p>

          <p>
            Folding a shield card will always replace a previously equipped
            shield.
          </p>

          <p>
            Shields are equal to their value and face cards (P,Kn,Q,K) each are
            equal to 11.
          </p>

          <h3>Sword/Wands: Monsters</h3>

          <p>
            Monster cards are equal to their value, and face cards are as
            follows P is 11, Kn is 12, Q is 13, K is 14.
          </p>

          <p>
            You may escape a room. When escaping, the remaining cards are put
            back at the end of the deck. A player is allowed to escape a room:
          </p>

          <p>
            When all monsters in the room have been dealt with, or when the
            player has not escaped the previous room.
          </p>

          <form method="dialog">
            <button>OK</button>
          </form>
        </dialog>
      </Html>
    </group>
  );
}
