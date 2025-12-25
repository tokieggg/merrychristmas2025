import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

// Workaround for missing JSX definitions in the current environment
const InstancedMesh = 'instancedMesh' as any;
const SphereGeometry = 'sphereGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

interface OrnamentsProps {
  count: number;
  treeState: TreeState;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ count, treeState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate data
  const { scatterData, treeData, colors } = useMemo(() => {
    const sData = [];
    const tData = [];
    const cData = new Float32Array(count * 3);

    const treeHeight = 11;
    const treeRadiusBase = 3.5;
    
    const palette = [
      new THREE.Color('#FFD700'), // Gold
      new THREE.Color('#D4AF37'), // Metallic Gold
      new THREE.Color('#C41E3A'), // Cardinal Red (Accent)
      new THREE.Color('#FFFFFF'), // Pearl
    ];

    for (let i = 0; i < count; i++) {
      // Scatter Logic (Modified to be a "Cloud" around where text would be)
      // Box approximate -15 to 15 width, -5 to 5 height, -5 to 5 depth
      sData.push(new THREE.Vector3(
        (Math.random() - 0.5) * 30, // Wide X
        (Math.random() - 0.5) * 12, // Medium Y
        (Math.random() - 0.5) * 8   // Shallow Z
      ));

      // Tree Logic
      const t = i / count;
      const angle = t * Math.PI * 2 * 15;
      const y = (t - 0.5) * treeHeight;
      const radius = (1 - t) * treeRadiusBase;
      
      tData.push(new THREE.Vector3(
        radius * Math.cos(angle),
        y,
        radius * Math.sin(angle)
      ));

      const color = palette[Math.floor(Math.random() * palette.length)];
      color.toArray(cData, i * 3);
    }

    return { scatterData: sData, treeData: tData, colors: cData };
  }, [count]);

  useLayoutEffect(() => {
    if (meshRef.current) {
        for (let i = 0; i < count; i++) {
            meshRef.current.setColorAt(i, new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]));
        }
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [colors, count]);


  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const target = treeState === TreeState.TREE_SHAPE ? 1 : 0;
    
    if (meshRef.current.userData.progress === undefined) meshRef.current.userData.progress = 0;
    
    const current = meshRef.current.userData.progress;
    const speed = 2.0 * delta;
    
    const next = THREE.MathUtils.lerp(current, target, speed);
    meshRef.current.userData.progress = next;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const sPos = scatterData[i];
      const tPos = treeData[i];

      dummy.position.lerpVectors(sPos, tPos, next);

      // Add "Scatter Float"
      if (next < 0.95) {
        const floatFactor = (1 - next);
        dummy.position.y += Math.sin(time + i) * 0.05 * floatFactor;
        dummy.position.x += Math.cos(time * 0.8 + i) * 0.05 * floatFactor;
      }
      
      // Add "Tree Rotate"
      if (next > 0.1) {
          dummy.rotation.y = time * 0.5 + i;
          dummy.rotation.z = time * 0.2;
      }

      const scaleBase = 0.2;
      const scale = THREE.MathUtils.lerp(scaleBase * 0.5, scaleBase, next);
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <InstancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <SphereGeometry args={[1, 16, 16]} />
      <MeshStandardMaterial 
        roughness={0.1} 
        metalness={0.9} 
        envMapIntensity={2.5}
      />
    </InstancedMesh>
  );
};