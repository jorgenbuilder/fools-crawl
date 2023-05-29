import { useTexture } from "@react-three/drei";

export default function Loader () {
    const heart = useTexture('/heart.png');

  return (
      <mesh position={[0, 0, 0]} scale={1}>
        <planeGeometry attach="geometry" args={[1, 1]} />
        <meshStandardMaterial attach="material" map={heart} transparent={true} />
      </mesh>
  );
}