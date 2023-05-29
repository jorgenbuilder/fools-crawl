import * as THREE from "three";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import {
  DECK_SIZE,
  dance,
  destinationSystem,
  die,
  getTarotCard,
  room,
  useStore,
  world,
} from "../state/store";
import { useStateMachine } from "../state/machine";

export default function Cards() {
  // const mesh = useRef<THREE.InstancedMesh>();
  const meshes = useRef<THREE.Group[]>([]);
  const cards = world.with("card");
  const texture = useTexture("/back.png");
  const [dancing, setDancing] = useState(false);
  const [dying, setDying] = useState(false);
  const { state, send } = useStateMachine();
  // const cardArt = useTexture(Array(DECK_SIZE).fill(0).map((_, i) => getTarotCard(i)).map((card) => `/deck/${card.suit}-${card.value}.jpg`))
  const cardArt = useTexture(
    Array(DECK_SIZE)
      .fill(0)
      .map((_, i) => getTarotCard(i))
      .map((card) => `/deck-2/${card.suit[0].toUpperCase()}${card.value}.png`)
  );

  useFrame(({ clock: { elapsedTime } }) => {
    // const ref = mesh.current;
    const ref = meshes.current;
    if (typeof ref === "undefined") return;
    // const dummy = new THREE.Object3D();

    if (state.matches("menu") || state.matches("game.win")) dance(elapsedTime);
    else if (state.matches("game.lose")) die();
    destinationSystem(elapsedTime);

    cards.entities.forEach((card, i) => {
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

  const activateCard = (i: number) => {
    if (!room.entities[0].room.cards.includes(i)) return;
    send("ACTIVATE_CARD", { index: i });
  };

  return (
    <>
      {cards.entities.map((card, i) => (
        <group
          key={`card-${card.card.index}`}
          ref={(el) => (meshes.current[i] = el)}
          onClick={() => activateCard(card.card.index)}
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
