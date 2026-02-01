import React, { useState } from 'react';
import { Calculator, ArrowRight, Trash2 } from 'lucide-react';
import { AdaptiveTile } from './Tile';
import { solveGame, parseSolutionToTokens, Token } from '../utils';

export default function SolverMode() {
  const [targetStr, setTargetStr] = useState('');
  const [diceStrs, setDiceStrs] = useState(['', '', '', '', '']); 
  const [resultTokens, setResultTokens] = useState<Token[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [calculating, setCalculating] = useState(false);

  const handleDiceChange = (index: number, value: string) => {
    const newDice = [...diceStrs];
    if (value.length > 2) return; 
    newDice[index] = value;
    setDiceStrs(newDice);
    setResultTokens(null);
    setErrorMsg('');
  };

  const handleSolve = () => {
    setCalculating(true);
    setResultTokens(null);
    setErrorMsg('');

    setTimeout(() => {
        const t = parseInt(targetStr);
        const d = diceStrs.map(s => parseInt(s));
        if (isNaN(t)) { setErrorMsg('請輸入有效的目標數字'); setCalculating(false); return; }
        if (d.some(n => isNaN(n))) { setErrorMsg('請填滿 5 個骰子數字'); setCalculating(false); return; }

        const solString = solveGame(d, t);
        
        if (solString) {
            const tokens = parseSolutionToTokens(solString);
            setResultTokens(tokens);
        } else {
            setErrorMsg('此組合無解 (No Solution)');
        }
        setCalculating(false);
    }, 300);
  };

  const handleClear = () => {
      setTargetStr('');
      setDiceStrs(['','','','','']);
      setResultTokens(null);
      setErrorMsg('');
  };

  const resultSizeClass = resultTokens ? (
    resultTokens.length > 12 ? 'w-6 h-6 text-xs' : 
    resultTokens.length > 9 ? 'w-8 h-8 text-sm' : 
    'w-10 h-10 text-lg'
  ) : 'w-10 h-10';

  return (
    <div className="flex flex-col items-center py-6 px-6 w-full max-w-lg mx-auto min-h-[80vh]">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-2">
                <Calculator /> 解題神器
            </h1>
            <p className="text-slate-400 text-sm mt-1">輸入題目，直接獲得答案</p>
        </div>

        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-6">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">目標數字 (Target)</label>
                <input 
                    type="number" 
                    placeholder="例如: 24"
                    value={targetStr}
                    onChange={(e) => { setTargetStr(e.target.value); setResultTokens(null); }}
                    className="w-full text-4xl font-black text-slate-800 border-b-2 border-orange-200 focus:border-orange-500 focus:outline-none py-1 placeholder:text-slate-200"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">骰子點數 (Dice)</label>
                <div className="grid grid-cols-5 gap-2">
                    {diceStrs.map((val, idx) => (
                        <div key={idx} className="aspect-square">
                            <input 
                                type="number"
                                placeholder={(idx+1).toString()}
                                value={val}
                                onChange={(e) => handleDiceChange(idx, e.target.value)}
                                className="w-full h-full text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none placeholder:text-slate-200"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    onClick={handleClear}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
                >
                    清空
                </button>
                <button 
                    onClick={handleSolve}
                    disabled={calculating}
                    className="flex-[2] bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition flex justify-center items-center gap-2"
                >
                    {calculating ? '計算中...' : <>開始計算 <ArrowRight size={18} /></>}
                </button>
            </div>
        </div>

        {(resultTokens || errorMsg) && (
            <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`
                    w-full min-h-[100px] rounded-2xl p-4 border-2 flex flex-col items-center justify-center
                    ${errorMsg ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}
                `}>
                    {errorMsg ? (
                        <div className="text-red-500 font-bold flex items-center gap-2">
                            <Trash2 size={20}/> {errorMsg}
                        </div>
                    ) : (
                        <>
                            <div className="text-green-600 font-bold text-sm mb-3 uppercase tracking-wider">最佳解法</div>
                            <div className={`flex flex-wrap justify-center items-center gap-1 w-full`}>
                                {resultTokens!.map((token, idx) => (
                                    <AdaptiveTile 
                                        key={idx}
                                        type={token.type}
                                        val={token.val}
                                        sizeClass={resultSizeClass}
                                        onClick={() => {}}
                                    />
                                ))}
                                <div className="text-2xl font-black text-slate-400 mx-2">=</div>
                                <div className="text-4xl font-black text-green-600">{targetStr}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}
