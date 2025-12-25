import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TreeState } from '../types';

// Workaround for missing JSX definitions in the current environment
const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const ShaderMaterial = 'shaderMaterial' as any;

// Custom Shader Material
const NeedleShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }, // 0 = Scattered (Text), 1 = Tree
    uColorTree: { value: new THREE.Color('#004225') }, // Deep Emerald
    uColorText: { value: new THREE.Color('#FFD700') }, // Gold
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
   
    varying float vRandom;
    varying float vProgress;
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }
    void main() {
      vRandom = aRandom;
      vProgress = uProgress;
     
      float t = easeInOutCubic(uProgress);
      vec3 pos = mix(aScatterPos, aTreePos, t);
     
      // Floating movement (more subtle on text to keep it readable)
      float floatIntensity = (1.0 - t);
      pos.x += sin(uTime * 0.5 + aRandom * 10.0) * 0.05 * floatIntensity;
      pos.y += cos(uTime * 0.3 + aRandom * 20.0) * 0.05 * floatIntensity;
      pos.z += sin(uTime * 0.7 + aRandom * 15.0) * 0.05 * floatIntensity;
      // Tree breathing
      float breathe = t * 0.05 * sin(uTime + pos.y);
      pos.x += pos.x * breathe;
      pos.z += pos.z * breathe;
     
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = (2.0 * aRandom + 0.6) * (10.0 / -mvPosition.z);  // ← Even smaller points for maximum gaps
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorTree;
    uniform vec3 uColorText;
    uniform float uTime;
    varying float vRandom;
    varying float vProgress;
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      // Sparkle effect
      float sparkle = sin(uTime * 3.0 + vRandom * 100.0);
     
      vec3 targetBaseColor = mix(uColorText, uColorTree, vProgress);
      vec3 highlightColor = mix(vec3(1.0, 1.0, 1.0), vec3(0.06, 0.42, 0.25), vProgress);
      vec3 finalColor = mix(targetBaseColor, highlightColor, sparkle * 0.5 + 0.5);
     
      float alpha = 1.0 - smoothstep(0.3, 0.5, r);
      gl_FragColor = vec4(finalColor, alpha * 0.9);
    }
  `
};

interface NeedlesProps {
  count: number;
  treeState: TreeState;
  name: string;
}

export const Needles: React.FC<NeedlesProps> = ({ count, treeState, name }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const [font, setFont] = useState<any>(null);

  // Load font once
  useEffect(() => {
    const loader = new FontLoader();
    loader.load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (loadedFont) => {
      setFont(loadedFont);
    });
  }, []);
 
  // Base Geometry Data (Tree & Random)
  const { positions, treePositions, randoms, initialScatter } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const tree = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const treeHeight = 12;
    const treeRadiusBase = 4;
    for (let i = 0; i < count; i++) {
      rnd[i] = Math.random();
      // Tree Position
      const yNorm = Math.random();
      const y = (yNorm - 0.5) * treeHeight;
      const radiusAtY = (1 - yNorm) * treeRadiusBase;
      const angle = Math.random() * Math.PI * 2;
      const radiusNoise = (Math.random() - 0.5) * 0.5;
      tree[i * 3] = (radiusAtY + radiusNoise) * Math.cos(angle);
      tree[i * 3 + 1] = y;
      tree[i * 3 + 2] = (radiusAtY + radiusNoise) * Math.sin(angle);
      // Initial Scatter (Sphere) - default fallback
      const r = 20 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
     
      scatter[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      scatter[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      scatter[i * 3 + 2] = r * Math.cos(phi);
      pos[i * 3] = scatter[i * 3];
      pos[i * 3 + 1] = scatter[i * 3 + 1];
      pos[i * 3 + 2] = scatter[i * 3 + 2];
    }
    return {
      positions: pos,
      treePositions: tree,
      randoms: rnd,
      initialScatter: scatter
    };
  }, [count]);

  // Recalculate scatter positions based on Text whenever name or font changes
  useEffect(() => {
    if (!font || !geometryRef.current) return;
    // Split lines
    const lines = ['Merry', 'Christmas'];
    if (name.trim()) lines.push(name.trim());
    const geometries: THREE.BufferGeometry[] = [];
    
    const size = 1.2;               // ← Same letter size
    const lineHeight = size * 1.8;   // Nice vertical spacing

    lines.forEach((line, i) => {
        const geo = new TextGeometry(line, {
            font: font,
            size: size,
            depth: 0.001,             // ← Almost completely flat (no thickness)
            curveSegments: 12,
            bevelEnabled: false,      // ← Disabled bevel = pure thin stroke, maximum gaps
            // No bevel settings needed since disabled
        });
        geo.computeBoundingBox();
        const width = geo.boundingBox!.max.x - geo.boundingBox!.min.x;
        // Center X alignment
        geo.translate(-width / 2, -i * lineHeight, 0);
        geometries.push(geo);
    });
    // Merge all lines into one geometry
    const mergedGeo = mergeGeometries(geometries);
    // Center the whole block
    mergedGeo.center();
    // Sample points from the text surface
    const mesh = new THREE.Mesh(mergedGeo);
    const sampler = new MeshSurfaceSampler(mesh).build();
    const tempPosition = new THREE.Vector3();
    const newScatter = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      sampler.sample(tempPosition);
      newScatter[i * 3] = tempPosition.x;
      newScatter[i * 3 + 1] = tempPosition.y;
      newScatter[i * 3 + 2] = tempPosition.z;
    }
    // Update the attribute
    geometryRef.current.attributes.aScatterPos.array.set(newScatter);
    geometryRef.current.attributes.aScatterPos.needsUpdate = true;
   
    // Cleanup
    geometries.forEach(g => g.dispose());
    mergedGeo.dispose();
  }, [font, name, count]);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
     
      const targetProgress = treeState === TreeState.TREE_SHAPE ? 1.0 : 0.0;
      const currentProgress = shaderRef.current.uniforms.uProgress.value;
     
      const step = delta * 1.5;
      if (Math.abs(currentProgress - targetProgress) > 0.001) {
          shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(currentProgress, targetProgress, step);
      }
    }
  });

  return (
    <Points>
      <BufferGeometry ref={geometryRef}>
        <BufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <BufferAttribute
          attach="attributes-aScatterPos"
          count={initialScatter.length / 3}
          array={initialScatter}
          itemSize={3}
        />
        <BufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <BufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </BufferGeometry>
      <ShaderMaterial
        ref={shaderRef}
        attach="material"
        args={[NeedleShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};
