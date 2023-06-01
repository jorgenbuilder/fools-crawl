import * as THREE from "three";
import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useTexture } from "@react-three/drei";

const Card = () => {
  const cardRef = useRef<THREE.Mesh>();
  const back = useTexture("/back.png");

  // Use react-three-fiber's useFrame to update the card's rotation every frame
  useFrame(() => {
    if (!cardRef.current) return;
    cardRef.current.rotation.z += 0.02;
  });

  useEffect(() => {
    if (!cardRef.current) return;
    // Use GSAP to create a shuffling animation
    gsap.to(cardRef.current.position, {
      y: 1,
      yoyo: true,
      repeat: -1,
      duration: 0.5,
    });
  }, []);

  return (
    <mesh ref={cardRef}>
      <mesh>
        <planeGeometry attach="geometry" args={[1, 1.73]} />
        <meshStandardMaterial
          attach="material"
          map={back}
          side={THREE.DoubleSide}
        />
      </mesh>
    </mesh>
  );
};

const LoadingAnimation = () => {
  const numCards = 3; // Number of cards to display
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      {[...Array(numCards)].map((_, index) => (
        <Card key={index} />
      ))}
    </>
  );
};

export default LoadingAnimation;
