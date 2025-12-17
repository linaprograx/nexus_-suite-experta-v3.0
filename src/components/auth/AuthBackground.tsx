import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- STABLE SHADER CODE (WEBGL 1.0 SAFE) ---
const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uIntro;

// --- 1. Safe Value Noise (No overload issues) ---
float hash(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

// --- 2. Deterministic Beam Function ---
// p: normalized UV (-0.5 to 0.5 with aspect)
// angle: direction
// width: beam thickness
// noiseVal: modulation factor
float beam(vec2 p, float angle, float offset, float width, float noiseVal) {
    // Rotate P
    float c = cos(angle);
    float s = sin(angle);
    vec2 rp = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
    
    // Distance to line
    float dist = abs(rp.y - offset);
    
    // Gaussian falloff
    float intensity = exp(-pow(dist / width, 2.0));
    
    // Smooth length fade (fades out at edges of screen)
    float along = smoothstep(-1.5, 1.5, rp.x); 
    
    return intensity * along * (0.5 + 0.5 * noiseVal);
}

void main() {
    // Setup Coordinates
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 p = uv - 0.5;
    p.x *= uResolution.x / uResolution.y; // Fix Aspect Ratio

    // Parallax (Clamped)
    vec2 parallax = (uMouse - 0.5) * 0.02;
    p -= parallax;

    float t = uTime * 0.1;

    // --- Layer A: Deep Space Base ---
    vec3 color = vec3(0.01, 0.02, 0.05); // Deep Blue
    
    // --- Layer B: Haze / Atmosphere ---
    // Warm Haze (Bottom Right)
    float distWarm = length(p - vec2(0.8, -0.4));
    float hazeWarm = exp(-distWarm * 1.5);
    
    // Cold Haze (Top Left)
    float distCold = length(p - vec2(-0.8, 0.4));
    float hazeCold = exp(-distCold * 1.5);

    // --- Layer C: Beam Field (deterministic inputs) ---
    float beams = 0.0;
    float slowNoise = noise(p * 1.0 + t * 0.5); // Modulation

    // Beam Set (Varied directions & widths)
    beams += beam(p, -0.6, 0.1, 0.15, slowNoise);   // Main Warm
    beams += beam(p, -0.7, -0.2, 0.10, slowNoise);  // Secondary
    beams += beam(p, -0.5, 0.3, 0.20, slowNoise);   // Wide
    beams += beam(p, 2.5, 0.1, 0.05, slowNoise);    // Cold crossing
    beams += beam(p, -0.65, -0.4, 0.08, slowNoise); // Detail
    
    // Ambient smaller beams
    beams += beam(p, -0.8, 0.0, 0.05, slowNoise) * 0.5;
    beams += beam(p, -0.4, 0.5, 0.06, slowNoise) * 0.5;
    beams += beam(p, 2.3, -0.3, 0.07, slowNoise) * 0.3;

    // Clamp intensity
    beams = clamp(beams, 0.0, 1.5);

    // --- Layer D: Caustic Detail (High freq, low opacity) ---
    float caustics = noise(p * 6.0 + vec2(t, -t)) * 0.5;
    caustics *= smoothstep(0.4, 0.0, length(p)); // Center focused

    // --- Composition ---
    vec3 colWarm = vec3(1.0, 0.5, 0.1); // Amber
    vec3 colCold = vec3(0.1, 0.4, 1.0); // Blue

    // Mix Haze
    color += colWarm * hazeWarm * 0.4;
    color += colCold * hazeCold * 0.3;

    // Mix Beams (Adaptive Color)
    // Beams reflect the haze color they pass through
    vec3 beamCol = mix(colCold, colWarm, smoothstep(-0.5, 0.5, p.x + p.y));
    color += beamCol * beams * 0.45;

    // Add Caustics
    color += beamCol * caustics * 0.08;

    // --- Layer E: Grading & Intro ---
    // Intro
    color *= smoothstep(0.0, 1.0, uIntro);

    // Vignette
    float vig = 1.0 - smoothstep(0.5, 1.6, length(uv - 0.5));
    color *= vig;

    // Grain
    float grain = fract(sin(dot(uv * (uTime + 10.0), vec2(12.9898,78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.03;

    gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = `
void main() {
  gl_Position = vec4( position, 1.0 );
}
`;

const CinematicPlane = () => {
    const mesh = useRef<THREE.Mesh>(null);
    const { size } = useThree();

    const mouse = useRef(new THREE.Vector2(0.5, 0.5));
    const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
    const introProgress = useRef(0);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(size.width, size.height) },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uIntro: { value: 0 }
        }),
        []
    );

    useEffect(() => {
        uniforms.uResolution.value.set(size.width, size.height);
    }, [size, uniforms]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            targetMouse.current.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useFrame((state, delta) => {
        if (mesh.current) {
            const mat = mesh.current.material as THREE.ShaderMaterial;
            mat.uniforms.uTime.value = state.clock.getElapsedTime();

            // Smooth Mouse
            mouse.current.lerp(targetMouse.current, 0.05);
            mat.uniforms.uMouse.value.copy(mouse.current);

            // Smooth Intro
            if (introProgress.current < 1) {
                introProgress.current += delta / 1.2;
                mat.uniforms.uIntro.value = Math.min(introProgress.current, 1);
            }
        }
    });

    return (
        <mesh ref={mesh}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                fragmentShader={fragmentShader}
                vertexShader={vertexShader}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
            />
        </mesh>
    );
};

export const AuthBackground = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[#010205]">
            <Canvas
                gl={{ antialias: false, powerPreference: "high-performance", depth: false }}
                camera={{ position: [0, 0, 1] }}
                dpr={[1, 1.5]}
            >
                <CinematicPlane />
            </Canvas>
        </div>
    );
};
