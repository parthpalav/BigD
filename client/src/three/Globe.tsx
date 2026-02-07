import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function GlobeMesh() {
  return (
    <>
      {/* Land */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Water (transparent shell) */}
      <mesh>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.15}
        />
      </mesh>
    </>
  );
}

export default function Globe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3] }}
      style={{ width: "360px", height: "360px" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <GlobeMesh />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        rotateSpeed={0.8}
      />
    </Canvas>
  );
}
