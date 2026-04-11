import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function F1CarModel() {
  const { scene } = useGLTF("/static/models/f1_ayrton_senna_1991_car.glb")
  const carRef = useRef();

  useFrame(() => {
    if (carRef.current) {
      carRef.current.rotation.y += 0.012; // spin speed
    }
  });

  return (
    <primitive
      ref={carRef}
      object={scene}
      scale={0.6}
      position={[0, -0.12, 0]}
    />
  );
}

useGLTF.preload("/static/models/f1_ayrton_senna_1991_car.glb");