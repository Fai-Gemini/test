import React from 'react';

interface TileProps {
  type: 'dice' | 'op';
  val: string | number;
  visible: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  isOverlay?: boolean;
}

export const Tile: React.FC<TileProps> = ({ type, val, visible, onPointerDown, isOverlay }) => {
    if (!visible) return <div className="w-12 h-12 m-1"></div>;
    const isDice = type === 'dice';
    return (
        <div
            onPointerDown={onPointerDown}
            className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold select-none touch-none
                ${isOverlay ? 'shadow-2xl scale-110' : 'shadow-sm border-b-4 active:border-b-0 active:translate-y-1'}
                ${isDice ? 'bg-orange-500 text-white border-orange-700' : 'bg-white text-slate-700 border-slate-300'}
                transition-transform cursor-grab active:cursor-grabbing
            `}
        >
            {val === '*' ? '×' : val === '/' ? '÷' : val}
        </div>
    );
};

interface AdaptiveTileProps {
    type: 'dice' | 'op';
    val: string | number;
    sizeClass: string;
    onClick?: () => void;
}

export const AdaptiveTile: React.FC<AdaptiveTileProps> = ({ type, val, sizeClass, onClick }) => {
    const isDice = type === 'dice';
    return (
      <div
        onClick={onClick}
        className={`
          ${sizeClass} rounded-lg flex items-center justify-center font-bold select-none shadow-sm border-b-2
          ${isDice ? 'bg-orange-500 text-white border-orange-700' : 'bg-white text-slate-700 border-slate-300'}
          transition-all
        `}
      >
        {val === '*' ? '×' : val === '/' ? '÷' : val}
      </div>
    );
};
