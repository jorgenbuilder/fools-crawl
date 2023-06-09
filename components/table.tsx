import { useTexture } from "@react-three/drei";
import { useArbitraryStore } from "../state/zustand";

export default function Table() {
  const texture = useTexture("/table.png");
  const ratio = 10 / 17.5;
  const { portrait } = useArbitraryStore();
  return (
    <mesh rotation={[0, 0, portrait ? Math.PI / 2 : 0]}>
      <meshStandardMaterial map={texture} />
      <planeGeometry args={[12, 12 * ratio]} />
    </mesh>
  );
}
