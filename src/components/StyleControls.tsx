import React from 'react';
import { 
  Trash2, 
  Layers, 
  BringToFront, 
  SendToBack,
  Sliders,
  Palette,
  Maximize2,
  Compass
} from 'lucide-react';
import { CanvasElement } from '../types';

interface StyleControlsProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

// Curated SaaS Color Presets
const PRESET_COLORS = [
  '#3b82f6', // Indigo-Blue
  '#ef4444', // Red-Rose
  '#10b981', // Emerald-Green
  '#f59e0b', // Amber-Yellow
  '#8b5cf6', // Purple-Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ffffff', // White
  '#6b7280', // Slate Gray
  '#1e293b', // Slate Dark
  '#000000', // Black
];

export const StyleControls: React.FC<StyleControlsProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onBringToFront,
  onSendToBack
}) => {
  if (!selectedElement) {
    return (
      <div className="w-full bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none h-full">
        <div className="w-12 h-12 rounded-full bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3">
          <Sliders className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-semibold text-slate-300">No Selection</h3>
        <p className="text-[11px] text-slate-500 max-w-[180px] mt-1">
          Select an element on the canvas to configure its properties and styling.
        </p>
      </div>
    );
  }

  const el = selectedElement;

  return (
    <div className="w-full bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto select-none">
      {/* Title */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">Properties</span>
        </div>
        <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono uppercase">
          {el.type}
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Layout Dimensions */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Compass className="w-3.5 h-3.5" />
            <span>Position & Size</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-mono">X Position</label>
              <input
                type="number"
                value={Math.round(el.x)}
                onChange={(e) => onUpdateElement(el.id, { x: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-mono">Y Position</label>
              <input
                type="number"
                value={Math.round(el.y)}
                onChange={(e) => onUpdateElement(el.id, { y: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-mono">Width</label>
              <input
                type="number"
                value={Math.round(el.width)}
                onChange={(e) => onUpdateElement(el.id, { width: Math.max(1, Number(e.target.value)) })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-mono">Height</label>
              <input
                type="number"
                value={Math.round(el.height)}
                onChange={(e) => onUpdateElement(el.id, { height: Math.max(1, Number(e.target.value)) })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Colors / Fill */}
        {el.type !== 'path' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Palette className="w-3.5 h-3.5" />
              <span>{el.type === 'icon' ? 'Icon Color' : 'Fill Color'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-850 cursor-pointer shrink-0">
                <input
                  type="color"
                  value={el.fill.startsWith('#') ? el.fill : '#3b82f6'}
                  onChange={(e) => onUpdateElement(el.id, { fill: e.target.value })}
                  className="absolute inset-0 w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer border-none bg-none"
                />
              </div>
              <input
                type="text"
                value={el.fill}
                onChange={(e) => onUpdateElement(el.id, { fill: e.target.value })}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            
            {/* Color Presets */}
            <div className="grid grid-cols-6 gap-1.5 mt-2 bg-slate-950/20 p-2 rounded-lg border border-slate-800/40">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateElement(el.id, { fill: color })}
                  className="w-full aspect-square rounded border border-slate-800/50 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Borders */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Border & Stroke</span>
          </div>

          {/* Border Width */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Thickness</span>
              <span className="text-slate-300">{el.borderWidth}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={el.borderWidth}
              onChange={(e) => onUpdateElement(el.id, { borderWidth: Number(e.target.value) })}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Border Color */}
          {el.borderWidth > 0 && (
            <div className="flex items-center gap-3 mt-2 animate-fadeIn">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-850 cursor-pointer shrink-0">
                <input
                  type="color"
                  value={el.borderColor.startsWith('#') ? el.borderColor : '#000000'}
                  onChange={(e) => onUpdateElement(el.id, { borderColor: e.target.value })}
                  className="absolute inset-0 w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer border-none bg-none"
                />
              </div>
              <input
                type="text"
                value={el.borderColor}
                onChange={(e) => onUpdateElement(el.id, { borderColor: e.target.value })}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
          )}
        </div>

        {/* Corner Radius for Rectangles */}
        {el.type === 'rect' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Corner Rounding</span>
              <span className="text-slate-300">{el.borderRadius ?? 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={el.borderRadius ?? 0}
              onChange={(e) => onUpdateElement(el.id, { borderRadius: Number(e.target.value) })}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Opacity</span>
            <span className="text-slate-300">{Math.round(el.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={el.opacity}
            onChange={(e) => onUpdateElement(el.id, { opacity: Number(e.target.value) })}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Layer Ordering */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Layer Order</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onBringToFront(el.id)}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              <BringToFront className="w-3.5 h-3.5" />
              <span>Bring Front</span>
            </button>
            <button
              onClick={() => onSendToBack(el.id)}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              <SendToBack className="w-3.5 h-3.5" />
              <span>Send Back</span>
            </button>
          </div>
        </div>

        {/* Delete Element Button */}
        <div className="pt-6">
          <button
            onClick={() => onDeleteElement(el.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 hover:border-red-600 text-red-400 text-xs font-medium transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Element</span>
          </button>
        </div>
      </div>
    </div>
  );
};
