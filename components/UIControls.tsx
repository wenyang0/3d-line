import React from 'react';
import { Hand, Loader2, Sparkles, Heart, Flower, Zap, Activity, Palette, Timer } from 'lucide-react';
import { SHAPE_LABELS, COLORS } from '../constants';
import { ShapeType as EShapeType } from '../types';

interface UIControlsProps {
  currentShape: EShapeType;
  onShapeChange: (shape: EShapeType) => void;
  color: string;
  onColorChange: (color: string) => void;
  handDetected: boolean;
  countdown: number | null;
}

const UIControls: React.FC<UIControlsProps> = ({
  currentShape,
  onShapeChange,
  color,
  onColorChange,
  handDetected,
  countdown
}) => {
  
  const getIcon = (shape: EShapeType) => {
    switch(shape) {
      case EShapeType.HEART: return <Heart size={16} />;
      case EShapeType.FLOWER: return <Flower size={16} />;
      case EShapeType.SATURN: return <Activity size={16} />;
      case EShapeType.MEDITATE: return <Zap size={16} />;
      case EShapeType.FIREWORKS: return <Sparkles size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 flex items-center gap-2">
            <Sparkles className="text-purple-400" />
            ZenParticles
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
             Move hands to interact. Close hands to trigger effect.
          </p>
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-colors duration-300 ${handDetected ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>
           {handDetected ? <Hand size={16} /> : <Loader2 size={16} className="animate-spin" />}
           <span className="text-sm font-medium">{handDetected ? 'Hands Detected' : 'Detecting...'}</span>
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/20 backdrop-blur-sm p-12 rounded-full border border-white/10 animate-pulse">
            <span className="text-9xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              {countdown}
            </span>
          </div>
        </div>
      )}

      {/* Main Controls - Bottom */}
      <div className="pointer-events-auto flex flex-col items-center gap-4 mb-8">
        
        {/* Shape Selector */}
        <div className="flex flex-wrap justify-center gap-2 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl">
          {(Object.values(EShapeType) as EShapeType[]).map((shape) => (
            <button
              key={shape}
              onClick={() => onShapeChange(shape)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium
                ${currentShape === shape 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {getIcon(shape)}
              {SHAPE_LABELS[shape]}
            </button>
          ))}
        </div>

        {/* Color Selector */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-2xl">
          <Palette size={16} className="text-gray-400" />
          <div className="h-4 w-[1px] bg-white/10" />
          {Object.entries(COLORS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onColorChange(value)}
              className={`w-8 h-8 rounded-full border-2 transition-transform duration-300 ${color === value ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: value }}
              aria-label={`Select ${key} color`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default UIControls;