import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeState } from '../types';
import { Needles } from './Needles';
import { Ornaments } from './Ornaments';

// Workaround for missing JSX definitions in the current environment
const Color = 'color' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const SpotLight = 'spotLight' as any;
const Group = 'group' as any;

interface SceneProps {
  treeState: TreeState;
  name: string;
}

export const Scene: React.FC<SceneProps> = ({ treeState, name }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
        // Subtle idle rotation of the whole group
        // Slower rotation when reading text
        const speed = treeState === TreeState.SCATTERED ? 0.01 : 0.05;
        groupRef.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  return (
    <>
      <Color attach="background" args={['#000502']} />
      
      {/* Cinematic Lighting */}
      <AmbientLight intensity={0.2} />
      <PointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" />
      <PointLight position={[-10, 5, -10]} intensity={1} color="#44ffaa" />
      <SpotLight 
        position={[0, 20, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        color="#fff"
      />

      {/* Luxury Reflections */}
      <Environment preset="city" />

      {/* Main Content Group */}
      <Group ref={groupRef} position={[0, 1, 0]}>
        <Needles count={15000} treeState={treeState} name={name} />
        <Ornaments count={300} treeState={treeState} />
      </Group>

      {/* Environment Extras */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Floor Reflection/Shadow */}
      <ContactShadows 
        opacity={0.7} 
        scale={40} 
        blur={2} 
        far={10} 
        resolution={256} 
        color="#000000" 
      />

      {/* Post Processing for the "Glow" */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <ToneMapping adaptive={true} resolution={256} middleGrey={0.6} maxLuminance={16.0} averageLuminance={1.0} adaptationRate={1.0} />
      </EffectComposer>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={8}
        maxDistance={40}
        autoRotate={false}
      />
    </>
  );
};
