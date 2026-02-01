import React, { useState } from 'react';
import { Puzzle, Calculator } from 'lucide-react';
import GameMode from './components/GameMode';
import SolverMode from './components/SolverMode';

export default function App() {
  const [view, setView] = useState<'game' | 'solver'>('game'); 

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 touch-none overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto">
        {view === 'game' ? <GameMode /> : <SolverMode />}
      </div>
      <div className="bg-white border-t border-slate-200 px-6 py-2 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 pb-safe">
        <button 
          onClick={() => setView('game')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${view === 'game' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
        >
          <Puzzle size={24} />
          <span className="text-xs font-bold">挑戰模式</span>
        </button>
        <div className="w-px h-8 bg-slate-200"></div>
        <button 
          onClick={() => setView('solver')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${view === 'solver' ? 'text-orange-600 bg-orange-50' : 'text-slate-400'}`}
        >
          <Calculator size={24} />
          <span className="text-xs font-bold">解題神器</span>
        </button>
      </div>
    </div>
  );
}
