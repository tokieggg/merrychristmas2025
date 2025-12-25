import React from 'react';
import { TreeState } from '../types';

interface UIProps {
  treeState: TreeState;
  setTreeState: (state: TreeState) => void;
  name: string;
  setName: (name: string) => void;
}

export const UI: React.FC<UIProps> = ({ treeState, setTreeState, name, setName }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
      
      {/* Top Header */}
      <header className="w-full text-center pt-8 pointer-events-none">
        <h1 className="text-2xl md:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 to-yellow-500 tracking-widest drop-shadow-lg px-4" style={{ fontFamily: 'Cinzel, serif' }}>
          Tom Interactive Christmas Tree
        </h1>
      </header>

      {/* Bottom Controls */}
      <div className="w-full pb-12 px-4 flex flex-col items-center gap-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-xl">
          <input 
            type="text" 
            placeholder="Enter your name..." 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full md:w-2/3 bg-black/30 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-500/40 font-serif tracking-wide focus:outline-none focus:border-yellow-500/60 transition-colors backdrop-blur-sm text-center md:text-left"
            style={{ fontFamily: 'Cinzel, serif' }}
          />

          <button
            onClick={() => setTreeState(
              treeState === TreeState.SCATTERED 
                ? TreeState.TREE_SHAPE 
                : TreeState.SCATTERED
            )}
            className={`
              w-full md:w-1/3 group relative px-6 py-3 overflow-hidden rounded-lg
              transition-all duration-700 ease-out
              border border-yellow-500/30 backdrop-blur-md
              ${treeState === TreeState.TREE_SHAPE ? 'bg-emerald-900/60' : 'bg-black/60'}
            `}
          >
            {/* Button Glow Background */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            
            <span className="relative z-10 font-serif text-yellow-100 tracking-widest text-sm md:text-base group-hover:text-white transition-colors duration-300">
              {treeState === TreeState.SCATTERED ? 'ASSEMBLE' : 'SCATTER MAGIC'}
            </span>
          </button>
        </div>

        <footer className="text-emerald-800/50 text-[10px] tracking-[0.3em] uppercase">
          Tom Interactive • Christmas 2025
        </footer>
      </div>
    </div>
  );
};
