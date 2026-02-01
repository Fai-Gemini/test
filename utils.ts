// Audio Engine
export const playSound = (type: 'roll' | 'pop' | 'win') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'roll') {
      for (let i = 0; i < 5; i++) {
        const start = t + Math.random() * 0.3;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        o.type = 'square';
        o.frequency.setValueAtTime(100 + Math.random() * 100, start);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(800, start);
        f.frequency.exponentialRampToValueAtTime(100, start + 0.1);
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.2, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.01, start + 0.15);
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(start); o.stop(start + 0.2);
      }
      return;
    }
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.2);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.4);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    }
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + (type === 'win' ? 0.8 : 0.1));
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// Core Solver Logic
interface Op {
  sym: string;
  apply: (a: number, b: number) => number | null;
}

const OPS: Op[] = [
  { sym: '+', apply: (a, b) => a + b },
  { sym: '-', apply: (a, b) => a - b },
  { sym: '*', apply: (a, b) => a * b },
  { sym: '/', apply: (a, b) => (b !== 0 ? a / b : null) },
];

export const solveGame = (numbers: number[], target: number): string | null => {
  const memo = new Set<string>();
  
  const recurse = (currentNums: number[], currentExprs: string[]): string | null => {
    if (currentNums.length === 1) {
      if (Math.abs(currentNums[0] - target) < 0.0001) return currentExprs[0];
      return null;
    }
    // Sort numbers to create a canonical state key, but we must track expressions alongside numbers.
    // However, since position matters for which expression corresponds to which number, we can't just sort blindly.
    // But for memoization of "available numbers", sorted order works if we only cared about reachability.
    // The original code used a simple key. Let's stick to it.
    const stateKey = currentNums.slice().sort((a, b) => a - b).join(',') + '|' + currentExprs.length;
    if (memo.has(stateKey)) return null;

    for (let i = 0; i < currentNums.length; i++) {
      for (let j = 0; j < currentNums.length; j++) {
        if (i === j) continue;
        const a = currentNums[i];
        const b = currentNums[j];
        const nextNumsBase = currentNums.filter((_, idx) => idx !== i && idx !== j);
        const nextExprsBase = currentExprs.filter((_, idx) => idx !== i && idx !== j);

        for (const op of OPS) {
          // Optimization: commutative operations, order doesn't matter for the pair
          if ((op.sym === '+' || op.sym === '*') && i > j) continue;
          
          const res = op.apply(a, b);
          if (res === null) continue;
          
          const newExprString = `(${currentExprs[i]} ${op.sym} ${currentExprs[j]})`;
          const result = recurse([...nextNumsBase, res], [...nextExprsBase, newExprString]);
          if (result) return result;
        }
      }
    }
    memo.add(stateKey);
    return null;
  };
  const initialExprs = numbers.map(n => n.toString());
  return recurse(numbers, initialExprs);
};

export interface Token {
  type: 'dice' | 'op';
  val: number | string;
  uniqueId: number;
}

export const parseSolutionToTokens = (solString: string): Token[] => {
  if (!solString) return [];
  const regex = /(\d+|[+\-*/()])/g;
  const matches = solString.match(regex);
  if (!matches) return [];
  return matches.map((str, index) => {
    if (!isNaN(parseInt(str)) && !['+', '-', '*', '/'].includes(str)) {
        return { type: 'dice', val: parseInt(str), uniqueId: index };
    }
    return { type: 'op', val: str, uniqueId: index };
  });
};
