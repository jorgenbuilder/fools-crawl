import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { GraphicalEntities } from "../state/graphics";

export default function Camera() {
  const { camera: _camera } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useFrame(() => {
    if (!GraphicalEntities.WithCamera.entities[0]) return;
    _camera.position.set(
      GraphicalEntities.WithCamera.entities[0].position.x,
      GraphicalEntities.WithCamera.entities[0].position.y,
      GraphicalEntities.WithCamera.entities[0].position.z
    );
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault />;
}
