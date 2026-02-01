import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Check, Lightbulb, Dices, GripHorizontal, Trash2 } from 'lucide-react';
import { Tile } from './Tile';
import { solveGame, playSound } from '../utils';

interface DiceItem {
    id: number;
    val: number;
    status: 'tray' | 'board';
}

interface EquationItem {
    type: 'dice' | 'op';
    val: number | string;
    sourceId?: number; // Only for dice
    uniqueId: number;
}

interface DragState {
    item: { type: 'dice' | 'op'; val: number | string; sourceId?: number };
    sourceType: 'tray' | 'board';
    originalIndex: number;
    startX: number;
    startY: number;
    currX: number;
    currY: number;
}

export default function GameMode() {
  const [mode, setMode] = useState<'random' | 'custom'>('random'); 
  const [target, setTarget] = useState(24);
  const [customTargetInput, setCustomTargetInput] = useState('24');
  const [dice, setDice] = useState<DiceItem[]>([]); 
  const [equation, setEquation] = useState<EquationItem[]>([]); 
  const [solution, setSolution] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'playing' | 'won'>('idle'); 
  const [message, setMessage] = useState('請按下擲骰子開始遊戲');
  
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const getTileSizeClass = (count: number) => {
    if (count > 12) return 'w-6 h-6 text-xs'; 
    if (count > 9) return 'w-8 h-8 text-sm';  
    if (count > 7) return 'w-10 h-10 text-base'; 
    return 'w-12 h-12 text-xl'; 
  };

  const handleRoll = useCallback(() => {
    playSound('roll');
    setStatus('playing');
    setEquation([]);
    setSolution(null);
    setMessage('擲骰中...');

    setTimeout(() => {
      let t = 0;
      let dVals: number[] = [];
      let sol: string | null = null;

      if (mode === 'random') {
        let found = false;
        let attempts = 0;
        while (!found && attempts < 200) {
          attempts++;
          t = Math.floor(Math.random() * 90) + 10;
          dVals = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
          sol = solveGame(dVals, t);
          if (sol) found = true;
        }
        if (!found) { handleRoll(); return; }
        setTarget(t);
      } else {
        t = parseInt(customTargetInput) || 24;
        setTarget(t);
        dVals = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
        sol = solveGame(dVals, t);
      }

      setDice(dVals.map((val, idx) => ({ id: idx, val, status: 'tray' })));
      setSolution(sol);
      setMessage(mode === 'custom' && !sol ? '注意：此數字組合可能無解' : '拖曳方塊到下方答題');
    }, 500);
  }, [mode, customTargetInput]);

  // Pointer Down: Start Dragging
  const handlePointerDown = (e: React.PointerEvent, item: any, source: 'tray' | 'board', index: number = -1) => {
    if (status !== 'playing') return;
    if (source === 'tray' && item.type === 'dice' && dice[item.sourceId].status === 'board') return;

    e.preventDefault();
    
    // Support Mouse and Touch via standard ClientX/Y from React's synthetic event or native
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    setDragState({
      item: { ...item },
      sourceType: source,
      originalIndex: index,
      startX: clientX, 
      startY: clientY, 
      currX: clientX, 
      currY: clientY,
    });
    
    // If picked from board, temporarily remove from equation
    if (source === 'board') {
       const newEq = [...equation];
       newEq.splice(index, 1);
       setEquation(newEq);
    }
  };

  // Global Drag Listener
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState) return;
      e.preventDefault(); 

      const x = e.clientX;
      const y = e.clientY;
      
      setDragState(prev => prev ? ({ ...prev, currX: x, currY: y }) : null);

      // Calc Drop Index
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        // Hit box with tolerance
        if (x >= rect.left - 30 && x <= rect.right + 30 && y >= rect.top - 50 && y <= rect.bottom + 50) {
            const children = Array.from(boardRef.current.children).filter(c => !(c as HTMLElement).dataset.placeholder) as HTMLElement[];
            
            if (children.length === 0) { 
                setDropIndex(0); 
                return; 
            }
            
            let minDist = Infinity;
            let closestIndex = children.length;
            
            for (let i = 0; i <= children.length; i++) {
                let cx, cy;
                if (i === 0) {
                    const r = children[0].getBoundingClientRect();
                    cx = r.left; cy = r.top + r.height/2;
                } else if (i === children.length) {
                    const r = children[i-1].getBoundingClientRect();
                    cx = r.right; cy = r.top + r.height/2;
                } else {
                    const r1 = children[i-1].getBoundingClientRect();
                    const r2 = children[i].getBoundingClientRect();
                    // Wrap detection
                    if (Math.abs(r1.top - r2.top) > 10) {
                         cx = r1.right + 10; cy = r1.top + r1.height/2; 
                    } else {
                         cx = (r1.right + r2.left) / 2;
                         cy = (r1.top + r1.height/2);
                    }
                }
                const dist = Math.hypot(x - cx, y - cy);
                if (dist < minDist) { minDist = dist; closestIndex = i; }
            }
            setDropIndex(closestIndex);
        } else {
            setDropIndex(null); 
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragState) return;
      
      const { item, sourceType } = dragState;

      if (dropIndex !== null) {
         // Valid Drop
         playSound('pop');
         const newItem: EquationItem = { 
             type: item.type, 
             val: item.val, 
             sourceId: item.sourceId, 
             uniqueId: Date.now() + Math.random() 
         };
         const newEq = [...equation];
         newEq.splice(dropIndex, 0, newItem);
         setEquation(newEq);
         
         if (item.type === 'dice') {
             setDice(prev => prev.map(d => d.id === item.sourceId ? { ...d, status: 'board' } : d));
         }
      } else {
          // Invalid Drop
          if (sourceType === 'board') {
              // Return dice
              if (item.type === 'dice') {
                  setDice(prev => prev.map(d => d.id === item.sourceId ? { ...d, status: 'tray' } : d));
              }
          } 
      }

      setDragState(null);
      setDropIndex(null);
    };

    if (dragState) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, equation, dice, dropIndex]);

  const handleSubmit = () => {
    if (status !== 'playing') return;
    const str = equation.map(i => i.val).join('');
    try {
        if (!str) return;
        if (/[^0-9+\-*/().\s]/.test(str)) throw new Error();
        // eslint-disable-next-line no-new-func
        const res = new Function(`return ${str}`)();
        if (Math.abs(res - target) < 0.001) {
            setStatus('won');
            setMessage('完美！挑戰成功！');
            playSound('win');
        } else {
            setMessage(`結果是 ${Math.round(res*1000)/1000}，不是 ${target}`);
        }
    } catch { setMessage('算式錯誤'); }
  };

  const handleClear = () => {
      setEquation([]);
      setDice(prev => prev.map(d => ({ ...d, status: 'tray' })));
  };

  const currentTileSizeClass = getTileSizeClass(equation.length + (dragState && dropIndex !== null ? 1 : 0));

  return (
    <div className="flex flex-col items-center py-4 px-4 w-full max-w-lg mx-auto">
      <div className="w-full mb-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-800">
           <Dices className="text-indigo-600"/> 骰子數學王
        </h1>
        <div className="flex bg-slate-200 rounded-lg p-1 text-xs font-bold">
            <button onClick={() => setMode('random')} className={`px-3 py-1.5 rounded transition ${mode === 'random' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>隨機</button>
            <button onClick={() => setMode('custom')} className={`px-3 py-1.5 rounded transition ${mode === 'custom' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>自選</button>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex justify-between items-center mb-4">
          <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Target</div>
              {mode === 'random' || status === 'playing' ? (
                  <div className="text-5xl font-black text-slate-800">{target}</div>
              ) : (
                  <input 
                      type="number" value={customTargetInput} 
                      onChange={e => setCustomTargetInput(e.target.value)}
                      className="text-5xl font-black text-slate-800 w-32 border-b-2 border-indigo-300 focus:outline-none bg-transparent"
                  />
              )}
          </div>
          <button 
              onClick={handleRoll}
              className="flex flex-col items-center justify-center w-20 h-20 bg-indigo-500 text-white rounded-xl shadow-lg active:scale-95 transition border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1"
          >
              <RefreshCw size={24} className={status === 'playing' ? '' : 'animate-spin'} />
              <span className="text-xs font-bold mt-1">擲骰</span>
          </button>
      </div>

      {/* Dice Tray */}
      <div className="w-full bg-slate-200 rounded-xl p-3 flex justify-center gap-2 min-h-[80px] items-center mb-3">
          {dice.length === 0 && <span className="text-slate-400 text-sm">請按「擲骰」開始</span>}
          {dice.map((d) => (
              <Tile 
                  key={d.id} type="dice" val={d.val} 
                  visible={d.status === 'tray'} 
                  onPointerDown={(e) => handlePointerDown(e, { type: 'dice', val: d.val, sourceId: d.id }, 'tray')}
              />
          ))}
      </div>

      {/* Operator Tray */}
      <div className="w-full flex justify-between px-1 mb-2">
          {['+', '-', '*', '/', '(', ')'].map(op => (
              <Tile key={op} type="op" val={op} visible={true} onPointerDown={(e) => handlePointerDown(e, { type: 'op', val: op }, 'tray')}/>
          ))}
      </div>

      {/* Equation Board */}
      <div className="w-full flex flex-col gap-1">
          <div className="flex justify-between items-end px-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <GripHorizontal size={14}/> 拖曳排序
              </span>
              <div className="flex gap-2">
                  <button onClick={handleClear} className="p-1.5 bg-slate-200 rounded hover:bg-red-100 hover:text-red-500 transition"><Trash2 size={16}/></button>
                  {solution && (
                      <button onClick={() => setMessage(`參考: ${solution}=${target}`)} className="p-1.5 bg-yellow-100 text-yellow-700 rounded transition"><Lightbulb size={16}/></button>
                  )}
              </div>
          </div>

          <div 
              ref={boardRef}
              className={`
                  min-h-[90px] bg-white rounded-xl border-2 transition-all p-2 flex flex-wrap items-center justify-start content-center
                  ${status === 'won' ? 'border-green-400 bg-green-50' : dropIndex !== null ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300'}
                  ${equation.length > 8 ? 'gap-1' : 'gap-2'} 
              `}
          >
              {equation.length === 0 && !dragState && (
                  <div className="w-full text-center text-slate-300 pointer-events-none select-none">
                      將方塊拖曳至此...
                  </div>
              )}

              {equation.map((item, idx) => {
                  const isPlaceholder = dragState && dropIndex === idx;
                  return (
                      <React.Fragment key={item.uniqueId || idx}>
                          {isPlaceholder && <div className={`w-1 rounded-full bg-indigo-500 animate-pulse mx-0.5 ${currentTileSizeClass.split(' ')[1]}`} data-placeholder="true"></div>}
                          
                          <div 
                             onPointerDown={(e) => handlePointerDown(e, item, 'board', idx)}
                             className={`cursor-grab active:cursor-grabbing ${currentTileSizeClass} rounded-lg flex items-center justify-center font-bold shadow-sm border-b-2 touch-none
                                ${item.type==='dice' ? 'bg-orange-500 text-white border-orange-700' : 'bg-white text-slate-700 border-slate-300'}
                             `}
                          >
                             {item.val === '*' ? '×' : item.val === '/' ? '÷' : item.val}
                          </div>

                      </React.Fragment>
                  );
              })}
              {dragState && dropIndex === equation.length && (
                  <div className={`w-1 rounded-full bg-indigo-500 animate-pulse mx-0.5 ${currentTileSizeClass.split(' ')[1]}`} data-placeholder="true"></div>
              )}
          </div>
      </div>

      <div className="mt-3 text-center h-6 font-bold text-indigo-600 text-sm">{message}</div>

      {status === 'playing' && (
          <button onClick={handleSubmit} className="w-full mt-3 bg-green-500 text-white font-bold py-3 rounded-xl shadow border-b-4 border-green-700 active:border-b-0 active:translate-y-1 text-lg flex justify-center items-center gap-2">
              <Check size={20}/> 提交答案
          </button>
      )}
      {status === 'won' && (
          <button onClick={handleRoll} className="w-full mt-3 bg-indigo-500 text-white font-bold py-3 rounded-xl shadow border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 text-lg animate-bounce">
              下一局
          </button>
      )}

      {dragState && (
          <div 
            className="fixed pointer-events-none z-50 opacity-90 scale-110 shadow-2xl"
            style={{ left: dragState.currX, top: dragState.currY, transform: 'translate(-50%, -50%)' }}
          >
              <Tile type={dragState.item.type} val={dragState.item.val} visible={true} isOverlay />
          </div>
      )}
    </div>
  );
}