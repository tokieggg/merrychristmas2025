import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);
  const [name, setName] = useState<string>("");

  return (
    <div className="w-full h-screen bg-[#000502] relative">
      <Suspense fallback={null}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 24], fov: 45 }}
          gl={{ antialias: false, toneMappingExposure: 1.5 }}
        >
          <Scene treeState={treeState} name={name} />
        </Canvas>
      </Suspense>
      
      <UI 
        treeState={treeState} 
        setTreeState={setTreeState} 
        name={name} 
        setName={setName} 
      />
      
      <Loader 
        containerStyles={{ background: '#000502' }}
        innerStyles={{ width: '200px', background: '#0f2f1e' }}
        barStyles={{ background: '#d4af37', height: '2px' }}
        dataStyles={{ color: '#d4af37', fontFamily: 'Cinzel, serif' }}
      />
    </div>
  );
};

export default App;