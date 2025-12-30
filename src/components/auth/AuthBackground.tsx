import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* =========================================================
   FRAGMENT SHADER — NEXUS AUTH CINEMATIC FINAL
   ========================================================= */

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uIntro;

/* ================= NOISE ================= */

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
    mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8,0.6,-0.6,0.8);
  for(int i=0;i<4;i++){
    v += a * noise(p);
    p = rot * p * 2.1;
    a *= 0.5;
  }
  return v;
}

/* ================= COLOR FIELD ================= */

vec3 colorField(float x, vec2 p){
  vec3 blue   = vec3(0.35,0.45,0.95);
  vec3 violet = vec3(0.60,0.42,0.85);
  vec3 green  = vec3(0.45,0.85,0.65);
  vec3 amber  = vec3(1.00,0.75,0.40);
  vec3 black  = vec3(0.0);

  float n = fbm(p*1.6);

  vec3 col = mix(blue, violet, smoothstep(-0.2,0.8,p.y));
  col += green * smoothstep(0.45,0.8,n) * 0.25;
  col += amber * smoothstep(0.65,0.9,n) * 0.22;

  /* COLOR FADES OUT LEFT → RIGHT (ENDS ~0.75) */
  float colorFade = 1.0 - smoothstep(0.55,0.75,x);
  col *= colorFade;

  /* BLACK COMES IN BY STEPS (0.6 → 1.0) */
  float dark =
    smoothstep(0.60,0.70,x)*0.25 +
    smoothstep(0.70,0.80,x)*0.25 +
    smoothstep(0.80,0.90,x)*0.25 +
    smoothstep(0.90,1.00,x)*0.25;

  dark = clamp(dark,0.0,1.0);
  dark = pow(dark,2.3);

  return mix(col, black, dark);
}

/* ================= ENERGY FILAMENT ================= */

float filament(vec2 p, float seed){
  float t = uTime*0.35 + seed;

  float wobble = sin(p.y*3.0 + t)*0.04;
  float branch = sin(p.y*12.0 + t*2.0)*0.015;

  p.x += wobble + branch;

  float d = abs(p.y);
  float core = exp(-pow(d/0.035,2.0));
  float fade = smoothstep(1.4,-0.3,p.x);

  return core * fade;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = uv - 0.5;
  p.x *= uResolution.x/uResolution.y;

  vec3 bg = colorField(uv.x,p);

  vec3 rays = vec3(0.0);
  vec3 warm = vec3(1.0,0.82,0.55);
  vec3 cold = vec3(0.45,0.65,1.0);

  /* MAIN STRUCTURAL RAYS */
  rays += warm * filament(vec2(p.x+0.25,p.y-0.15),0.0)*0.9;
  rays += cold * filament(vec2(p.x+0.05,p.y+0.35),8.0)*0.7;
  rays += warm * filament(vec2(p.x+0.45,p.y-0.45),16.0)*0.6;
  rays += cold * filament(vec2(p.x+0.15,p.y+0.55),24.0)*0.5;

  /* SECONDARY FILAMENTS */
  for(int i=0;i<8;i++){
    float f = filament(
      vec2(p.x+0.12*float(i), p.y+sin(float(i))*0.55),
      float(i)*11.7
    );
    vec3 c = mix(warm,cold,fract(float(i)*0.37));
    rays += c * f * 0.28;
  }

  /* GLASS DIFFUSION ZONE (CARD AREA) */
  float glass =
    smoothstep(0.30,0.0,abs(p.x)) *
    smoothstep(0.45,0.0,abs(p.y));

  rays *= mix(1.0,0.25,glass);

  /* SPARKLE ENERGY */
  float l = dot(rays,vec3(0.333));
  rays += smoothstep(0.35,0.9,l)*vec3(1.0,0.95,0.85)*0.18;

  vec3 color = bg + rays;

  /* VIGNETTE */
  color *= 1.0 - smoothstep(0.45,1.2,length(uv-0.5));
  color *= smoothstep(0.0,1.0,uIntro);

  gl_FragColor = vec4(color,1.0);
}
`;

const vertexShader = `
void main(){
  gl_Position = vec4(position,1.0);
}
`;

const CinematicPlane = () => {
    const mesh = useRef<THREE.Mesh>(null);
    const { size } = useThree();
    const intro = useRef(0);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uIntro: { value: 0 }
    }), []);

    useEffect(() => {
        uniforms.uResolution.value.set(size.width, size.height);
    }, [size]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const mat = mesh.current.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = state.clock.getElapsedTime();
        intro.current = Math.min(1, intro.current + delta / 1.2);
        mat.uniforms.uIntro.value = intro.current;
    });

    return (
        <mesh ref={mesh}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                fragmentShader={fragmentShader}
                vertexShader={vertexShader}
                uniforms={uniforms}
                depthWrite={false}
            />
        </mesh>
    );
};

export const AuthBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#010205]">
        <Canvas
            key="auth-bg-nexus-final"
            camera={{ position: [0, 0, 1] }}
            gl={{ antialias: false, depth: false }}
            dpr={[1, 1.5]}
        >
            <CinematicPlane />
        </Canvas>
    </div>
);