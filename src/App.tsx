import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Blob from "./Blob";
import "./App.css";

function App() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Blob />
          <OrbitControls enableZoom={true} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
