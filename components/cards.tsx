import * as THREE from "three";
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GameConstants, GameMachine, TarotDeck } from "../state/game";
import { Animation, GameSystems, GraphicalEntities } from "../state/graphics";

export default function Cards() {
  // const mesh = useRef<THREE.InstancedMesh>();
  const meshes = useRef<THREE.Group[]>([]);
  const texture = useTexture("/back.png");
  const { state, send } = GameMachine.use();
  // const cardArt = useTexture(Array(DECK_SIZE).fill(0).map((_, i) => getTarotCard(i)).map((card) => `/deck/${card.suit}-${card.value}.jpg`))
  const cardArt = useTexture(
    Array(GameConstants.DECK_SIZE)
      .fill(0)
      .map((_, i) => TarotDeck.getTarotCard(i))
      .map((card) => `/deck-2/${card.suit[0].toUpperCase()}${card.value}.png`)
  );

  useFrame(({ clock: { elapsedTime } }) => {
    // const ref = mesh.current;
    const ref = meshes.current;
    if (typeof ref === "undefined") return;
    // const dummy = new THREE.Object3D();

    if (state.matches("Menu") || state.matches("GamePlay.Win")) {
      Animation.DancingCards(elapsedTime);
    } else if (state.matches("GamePlay.GameOver")) {
      Animation.DyingCards();
    }
    GameSystems.DestinationSystem(elapsedTime);

    GraphicalEntities.WithCard.entities.forEach((card, i) => {
      // Set the position and rotation of the dummy object based on the card's state
      // dummy.position.set(card.position.x, card.position.y, card.position.z);
      // dummy.rotation.set(card.rotation.x, card.rotation.y, card.rotation.z);

      // // Update the matrix of the i-th instance
      // dummy.updateMatrix();
      // ref.setMatrixAt(i, dummy.matrix);

      meshes.current[i].position.set(
        card.position.x,
        card.position.y,
        card.position.z
      );
      meshes.current[i].rotation.set(
        card.rotation.x,
        card.rotation.y,
        card.rotation.z
      );
    });

    // ref.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {GraphicalEntities.WithCard.entities.map((card, i) => (
        <group
          key={`card-${card.card.index}`}
          ref={(el) => (meshes.current[i] = el)}
          onClick={() => send("FOLD_CARD", { index: i })}
        >
          <mesh>
            <planeGeometry attach="geometry" args={[1, 1.73]} />
            <meshStandardMaterial
              attach="material"
              map={texture}
              side={THREE.BackSide}
            />
          </mesh>
          {/* <Suspense fallback={<mesh>
                <planeGeometry attach="geometry" args={[1, 1.73]} />
                <meshStandardMaterial attach="material" color="white" side={THREE.FrontSide} />
            </mesh>}>
                <Art i={i} />
            </Suspense> */}
          <mesh>
            <planeGeometry attach="geometry" args={[1, 1.73]} />
            <meshStandardMaterial
              attach="material"
              map={cardArt[card.card.index]}
              side={THREE.FrontSide}
            />
          </mesh>
        </group>
      ))}
    </>
    // <instancedMesh ref={mesh} args={[null, null, cards.entities.length]}>
    //     <planeGeometry attach="geometry" args={[1, 1.73]} />
    //     <meshStandardMaterial attach="material" map={texture} />
    // </instancedMesh>
  );
}

// function Art({ i }: { i: number }) {
//     const card = useMemo(() => getTarotCard(i), [i])
//     const cardArt = useTexture(`/deck/${card.suit}-${card.value}.jpg`)
//     return <mesh>
//         <planeGeometry attach="geometry" args={[1, 1.73]} />
//         <meshStandardMaterial attach="material" map={cardArt} side={THREE.FrontSide} />
//     </mesh>
// }
