import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useStore, world } from "../state/store";
import { PerspectiveCamera } from "@react-three/drei";
import { useStateMachine } from "../state/machine";

function addCamera() {
  world.add({
    camera: null,
    position: { x: 0, y: 0, z: 5 },
    destination: { x: 0, y: 0, z: 6 },
  });
}

const gameObject = world.with("camera", "position");

export default function Camera() {
  const { camera: _camera } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const { state } = useStateMachine();
  const { portrait } = useStore();

  useEffect(() => {
    addCamera();
    // set({ camera })
  }, []);

  useEffect(() => {
    if (state.matches("game.win") || state.matches("game.lose")) {
      gameObject.entities[0].destination.z = 6;
    } else if (state.matches("game")) {
      gameObject.entities[0].destination.z = portrait ? 5.5 : 4;
    }
  }, [state, portrait]);

  useFrame(() => {
    if (!gameObject.entities[0]) return;
    _camera.position.set(
      gameObject.entities[0].position.x,
      gameObject.entities[0].position.y,
      gameObject.entities[0].position.z
    );
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault />;
}
