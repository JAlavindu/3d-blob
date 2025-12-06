import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import Blob from "./Blob";
import "./App.css";

function App() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ antialias: false }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#000000"]} />

          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={2}
            color="#ffffff"
          />
          <directionalLight
            position={[-5, -5, -5]}
            intensity={1}
            color="#ff00ff"
          />

          <Blob />

          <OrbitControls enableZoom={true} />

          {/* Environment for reflections */}
          <Environment preset="warehouse" environmentIntensity={1.5} />

          {/* Post Processing */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              mipmapBlur
              intensity={0.8}
              radius={0.4}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
