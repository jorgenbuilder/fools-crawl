import { useTexture } from "@react-three/drei";

export default function Table() {
  const texture = useTexture("/table.png");
  const ratio = 10 / 17.5;
  return (
    <mesh>
      <meshStandardMaterial map={texture} />
      <planeGeometry args={[12, 12 * ratio]} />
    </mesh>
  );
}
