import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { GraphicsEntities } from "../state/graphics";

export default function Camera() {
  const { camera } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useFrame(() => {
    const GameObject = GraphicsEntities.WithCamera.entities[0];
    if (!GameObject) return;
    camera.position.copy(GameObject.position);
    camera.rotation.x = GameObject.rotation.x;
    camera.rotation.y = GameObject.rotation.y;
    camera.rotation.z = GameObject.rotation.z;
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault />;
}
