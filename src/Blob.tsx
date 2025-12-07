import React, { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Shader {
  uniforms: { [uniform: string]: THREE.IUniform };
  vertexShader: string;
  fragmentShader: string;
}

// GLSL Simplex Noise function
const noiseGLSL = `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }
`;

const Blob = () => {
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const hover = useRef(false);

  // Uniforms to pass time to the shader
  const uniforms = useRef({
    uTime: { value: 0 },
    uIntensity: { value: 0.3 },
    uSpeed: { value: 0.4 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  });

  useFrame((state) => {
    if (materialRef.current) {
      // Update time uniform
      uniforms.current.uTime.value = state.clock.getElapsedTime();

      // Smoothly interpolate mouse position
      uniforms.current.uMouse.value.lerp(state.pointer, 0.1);

      // Dynamic intensity based on hover
      const targetIntensity = hover.current ? 0.8 : 0.3;
      uniforms.current.uIntensity.value = THREE.MathUtils.lerp(
        uniforms.current.uIntensity.value,
        targetIntensity,
        0.05
      );

      // Rotate mesh slightly based on mouse
      if (meshRef.current) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(
          meshRef.current.rotation.x,
          state.pointer.y * 0.2,
          0.05
        );
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          meshRef.current.rotation.y,
          state.pointer.x * 0.2,
          0.05
        );
      }
    }
  });

  const onBeforeCompile = useCallback((shader: Shader) => {
    shader.uniforms.uTime = uniforms.current.uTime;
    shader.uniforms.uIntensity = uniforms.current.uIntensity;
    shader.uniforms.uSpeed = uniforms.current.uSpeed;
    shader.uniforms.uMouse = uniforms.current.uMouse;

    // Inject noise function
    shader.vertexShader = `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSpeed;
      uniform vec2 uMouse;
      ${noiseGLSL}
      ${shader.vertexShader}
    `;

    // Inject displacement logic
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
        #include <begin_vertex>
        
        // Calculate noise based on position, time, and mouse
        vec3 noisePos = vec3(
          position.x * 0.5 + uMouse.x * 1.0, 
          position.y * 0.5 + uMouse.y * 1.0, 
          position.z * 0.5 + uTime * uSpeed
        );
        
        float noise = snoise(noisePos);
        
        // Varying thickness for ribbon effect
        float thickness = 0.5 + 0.5 * sin(position.x * 3.0 + uTime);
        
        // Displace along normal with varying intensity
        vec3 displacement = normal * noise * uIntensity * (1.0 + thickness);
        transformed += displacement;
      `
    );
  }, []);

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => (hover.current = true)}
      onPointerOut={() => (hover.current = false)}
    >
      {/* Complex twisted torus knot for ribbon-like shape */}
      <torusKnotGeometry args={[1, 0.3, 256, 64, 3, 5]} />
      <meshPhysicalMaterial
        ref={materialRef}
        onBeforeCompile={onBeforeCompile}
        transmission={1}
        roughness={0}
        metalness={0.5}
        thickness={0.1}
        iridescence={1}
        iridescenceIOR={2.2}
        iridescenceThicknessRange={[100, 800]}
        clearcoat={1}
        clearcoatRoughness={0}
        color={"#ffffff"}
        ior={1.2}
        dispersion={2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Blob;
