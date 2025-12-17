import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- STABLE & TUNED SHADER (WEBGL 1.0 SAFE) ---
const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uIntro;

// --- Safe Value Noise ---
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

// --- Beam Logic ---
// angle: direction
// offset: shift from center
// width: thickness
float beam(vec2 uv, float angle, float offset, float width) {
    float c = cos(angle);
    float s = sin(angle);
    vec2 p = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
    
    // Distance from center line
    float d = abs(p.y - offset);
    
    // Smooth Gaussian falloff (Volumetric feel)
    float intensity = exp(-pow(d / width, 2.0));
    
    // Soft fade along length (prevent hard cutoffs)
    float fade = smoothstep(-1.5, 1.5, p.x); 
    
    return intensity * fade;
}

void main() {
    // 0. Coords
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 p = uv - 0.5;
    p.x *= uResolution.x / uResolution.y;

    // 1. Micro Parallax (Slightly opposite to mouse)
    vec2 parallax = (uMouse - 0.5) * 0.03;
    p -= parallax;

    float t = uTime * 0.15; // Slow ambient move

    // --- A. DARK BASE (Void) ---
    vec3 color = vec3(0.002, 0.005, 0.01); // Almost black, hint of deep blue

    // --- B. STRUCTURAL BEAM SYSTEM ---
    float beams = 0.0;
    
    // Slow organic modification
    float drift = noise(p * 0.5 + t * 0.1); 

    // Beam 1: Primary Warm (Bottom Right -> Top Left)
    float b1 = beam(p, -0.6, 0.15, 0.18 + drift*0.05);
    // Beam 2: Secondary Warm (Lower)
    float b2 = beam(p, -0.5, -0.3, 0.12 + drift*0.05);
    
    // Beam 3: Cold Counter (Top Left -> Bottom Right)
    float b3 = beam(p, 2.4, 0.2, 0.08 + drift*0.03);
    
    // Beam 4: Sharp Detail Ray
    float b4 = beam(p, -0.65, 0.05, 0.04);
    
    // Beam 5: Ambient Wide
    float b5 = beam(p, -0.8, 0.4, 0.25);

    // Beam 6: Low Backlight
    float b6 = beam(p, 2.8, -0.4, 0.15);

    // Accumulate (Weighted)
    vec3 warmLight = vec3(1.0, 0.45, 0.1); // Amber
    vec3 coldLight = vec3(0.1, 0.4, 1.0);  // Azure
    
    // Mix beams into color volumetrically
    color += warmLight * b1 * 0.45;
    color += warmLight * b2 * 0.35;
    color += coldLight * b3 * 0.30;
    color += warmLight * b4 * 0.25; // Sharp ray
    color += warmLight * b5 * 0.15; // Ambient
    color += coldLight * b6 * 0.15;

    // --- C. DUST / HOTSPOTS ---
    // High frequency noise in the air
    float dust = noise(p * 10.0 + t * 0.5);
    // Only visible inside beams
    float beamMask = smoothstep(0.0, 1.0, b1 + b2 + b3);
    float sparkles = smoothstep(0.6, 0.95, dust) * beamMask;
    
    color += vec3(1.0, 0.9, 0.8) * sparkles * 0.05; // Subtle shimmer

    // --- D. HAZE (Atmosphere) ---
    // Light scattering
    float haze = noise(p * 1.5 - t * 0.2);
    color += mix(coldLight, warmLight, uv.x) * haze * 0.05;

    // --- E. GRADE & FINISH ---
    // Intro
    color *= smoothstep(0.0, 1.0, uIntro);

    // Deep Shadows
    color = pow(color, vec3(1.2)); // Contrast boost
    
    // Vignette
    float vig = 1.0 - smoothstep(0.4, 1.6, length(uv - 0.5));
    color *= vig;
    
    // Grain (Film feel)
    float grain = fract(sin(dot(uv * (uTime + 10.0), vec2(12.9898,78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.04;

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

            mouse.current.lerp(targetMouse.current, 0.05);
            mat.uniforms.uMouse.value.copy(mouse.current);

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
