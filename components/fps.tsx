import { Html } from '@react-three/drei';
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

export function FPS () {
    const [fps, setFps] = useState(0);
    const frameCount = useRef(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFps(frameCount.current);
            frameCount.current = 0;
        }, 1000);

        return () => clearInterval(interval);
    });

    useFrame(() => {
        frameCount.current++;
    });

    return <Html position={[0, 1.75, 0]}>
        <div style={{ fontFamily: "monospace" }}>
            {Math.floor(fps)}
        </div>
    </Html>
}