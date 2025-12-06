import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { Vector2 } from "three";
import Blob from "./Blob";
import "./App.css";

function App() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{ antialias: false }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#000000"]} />

          {/* Dramatic Side Lighting */}
          <ambientLight intensity={0.1} />
          <directionalLight
            position={[10, 0, 5]}
            intensity={4}
            color="#ffffff"
          />
          <directionalLight
            position={[-10, 5, -5]}
            intensity={2}
            color="#4400ff" // Deep blue/purple fill
          />
          <directionalLight
            position={[0, -10, 0]}
            intensity={1}
            color="#ff00aa" // Magenta underlight
          />

          <Blob />

          <OrbitControls enableZoom={true} />

          {/* Environment for reflections */}
          <Environment preset="studio" environmentIntensity={1.0} />

          {/* Post Processing */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.1}
              mipmapBlur
              intensity={0.6}
              radius={0.5}
            />
            <ChromaticAberration
              offset={new Vector2(0.002, 0.002)}
              radialModulation={false}
              modulationOffset={0}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
