import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Layers, 
  BringToFront, 
  SendToBack,
  Sliders,
  Palette,
  Maximize2,
  Compass,
  AlignJustify,
  Grid,
  Smile
} from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { BoxModel } from '../types';
import { ALL_ICONS, getIconComponent } from '../utils/lucideIcons';

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

export const StyleControls: React.FC = () => {
  const {
    elements,
    selectedId,
    viewportMode,
    updateElement,
    deleteElement,
    bringToFront,
    sendToBack
  } = useCanvas();

  const [iconSearchQuery, setIconSearchQuery] = useState('');

  const filteredIcons = useMemo(() => {
    const query = iconSearchQuery.trim().toLowerCase();
    if (!query) {
      return [
        'Star', 'Heart', 'Smile', 'Check', 'X', 'Search', 'Home', 'Settings', 
        'User', 'Bell', 'Camera', 'Mail', 'ThumbsUp', 'MapPin', 'Calendar', 
        'Trash2', 'Plus', 'Play', 'Info', 'HelpCircle', 'Folder', 'Copy', 
        'Share2', 'LogOut', 'Activity', 'AlertTriangle', 'Book', 'Briefcase',
        'Cloud', 'CreditCard', 'Download', 'Eye', 'Gift', 'Image',
        'Lock', 'MessageSquare', 'Music', 'Phone', 'Send', 'ShoppingCart',
        'Sliders', 'Smartphone', 'Sun', 'Video', 'Volume2', 'Wifi', 'Zap'
      ];
    }
    return ALL_ICONS.filter(name => name.toLowerCase().includes(query)).slice(0, 48);
  }, [iconSearchQuery]);

  // Helper to find selected element recursively
  const findElementById = (tree: any[], id: string): any | null => {
    for (const el of tree) {
      if (el.id === id) return el;
      if (el.children) {
        const found = findElementById(el.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const el = selectedId ? findElementById(elements, selectedId) : null;

  if (!el) {
    return (
      <div className="w-full bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none h-full">
        <div className="w-12 h-12 rounded-full bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
          <Sliders className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-semibold text-slate-300">No Element Selected</h3>
        <p className="text-[11px] text-slate-500 max-w-[180px] mt-1.5 leading-relaxed">
          Click elements on the canvas to configure properties, alignment, and spacing.
        </p>
      </div>
    );
  }

  // Resolve current active viewport values
  const getActiveVal = <T,>(valObj: { base: T; md?: T; lg?: T }): T => {
    if (viewportMode === 'desktop' && valObj.lg !== undefined) return valObj.lg;
    if (viewportMode === 'tablet' && valObj.md !== undefined) return valObj.md;
    return valObj.base;
  };

  const handleUpdateGeometry = (field: 'x' | 'y' | 'width' | 'height', val: number | string) => {
    const origObj = el[field];
    const updated = { ...origObj };
    
    if (viewportMode === 'desktop') updated.lg = val;
    else if (viewportMode === 'tablet') updated.md = val;
    else updated.base = val;

    updateElement(el.id, { [field]: updated });
  };

  const handleUpdateBoxModel = (type: 'margin' | 'padding', side: keyof BoxModel, val: number) => {
    const box = { ...el.styles[type] };
    box[side] = val;
    updateElement(el.id, {
      styles: {
        ...el.styles,
        [type]: box
      }
    });
  };

  const currentX = getActiveVal(el.x);
  const currentY = getActiveVal(el.y);
  const currentW = getActiveVal(el.width);
  const currentH = getActiveVal(el.height);

  return (
    <div className="w-full bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto select-none">
      {/* Inspector Panel Title */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">Properties</span>
        </div>
        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
          {el.type}
        </span>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Icon swap picker */}
        {el.type === 'icon' && (
          <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Smile className="w-3.5 h-3.5 text-indigo-400" />
              <span>Change Icon Symbol</span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={iconSearchQuery}
                onChange={(e) => setIconSearchQuery(e.target.value)}
                placeholder="Search 1,000+ icons..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-200 outline-none transition-all placeholder-slate-600"
              />
              {iconSearchQuery && (
                <button
                  onClick={() => setIconSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[16px] leading-none px-1"
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="max-h-[140px] overflow-y-auto pr-1">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-6 gap-1.5 p-1 bg-slate-950/40 rounded-lg border border-slate-850">
                  {filteredIcons.map((name) => {
                    const Component = getIconComponent(name);
                    const isSelected = el.iconName === name;
                    return (
                      <button
                        key={name}
                        onClick={() => updateElement(el.id, { iconName: name })}
                        className={`aspect-square flex items-center justify-center rounded border transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-950/10'
                        }`}
                        title={name}
                      >
                        <Component className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-600 border border-dashed border-slate-850 rounded-lg">
                  No icons found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. Viewport geometry inputs */}
        <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Viewport Box ({viewportMode.toUpperCase()})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">X Position</label>
              <input
                type="number"
                value={typeof currentX === 'number' ? Math.round(currentX) : 0}
                onChange={(e) => handleUpdateGeometry('x', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Y Position</label>
              <input
                type="number"
                value={typeof currentY === 'number' ? Math.round(currentY) : 0}
                onChange={(e) => handleUpdateGeometry('y', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Width</label>
              <input
                type="number"
                value={typeof currentW === 'number' ? Math.round(currentW) : 100}
                onChange={(e) => handleUpdateGeometry('width', Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Height</label>
              <input
                type="number"
                value={typeof currentH === 'number' ? Math.round(currentH) : 100}
                onChange={(e) => handleUpdateGeometry('height', Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
          </div>
        </div>

        {/* 2. Container Flexbox layouts */}
        {el.type === 'container' && (
          <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Grid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Flexbox Alignment</span>
            </div>
            
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">Direction</span>
                <select
                  value={el.styles.alignItems ? 'col' : 'row'}
                  onChange={(e) => updateElement(el.id, {
                    styles: {
                      ...el.styles,
                      alignItems: e.target.value === 'col' ? 'center' : undefined
                    }
                  })}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-2 py-0.5"
                >
                  <option value="row">flex-row (Horizontal)</option>
                  <option value="col">flex-col (Vertical)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">Align Items</span>
                <select
                  value={el.styles.alignItems || 'stretch'}
                  onChange={(e) => updateElement(el.id, {
                    styles: { ...el.styles, alignItems: e.target.value as any }
                  })}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-2 py-0.5"
                >
                  <option value="stretch">Stretch</option>
                  <option value="center">Center</option>
                  <option value="start">Start</option>
                  <option value="end">End</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">Justify Content</span>
                <select
                  value={el.styles.justifyContent || 'start'}
                  onChange={(e) => updateElement(el.id, {
                    styles: { ...el.styles, justifyContent: e.target.value as any }
                  })}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-2 py-0.5"
                >
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="between">Space Between</option>
                  <option value="around">Space Around</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">Gap Space (px)</span>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={el.styles.gap || 0}
                  onChange={(e) => updateElement(el.id, {
                    styles: { ...el.styles, gap: Number(e.target.value) }
                  })}
                  className="w-16 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-2 py-0.5 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Margins & Paddings Box model updates */}
        <div className="space-y-4 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <AlignJustify className="w-3.5 h-3.5 text-indigo-400" />
            <span>Spacing (Margins & Paddings)</span>
          </div>

          {/* Padding parameters */}
          <div className="space-y-2">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Paddings (px)</span>
            <div className="grid grid-cols-4 gap-2">
              {['top', 'right', 'bottom', 'left'].map((side) => (
                <div key={side} className="space-y-1">
                  <label className="text-[9px] text-slate-500 capitalize">{side}</label>
                  <input
                    type="number"
                    min="0"
                    value={el.styles.padding[side as keyof BoxModel]}
                    onChange={(e) => handleUpdateBoxModel('padding', side as keyof BoxModel, Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-800/30 rounded p-1 text-center text-xs font-mono text-emerald-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Margin parameters */}
          <div className="space-y-2 pt-2 border-t border-slate-850">
            <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Margins (px)</span>
            <div className="grid grid-cols-4 gap-2">
              {['top', 'right', 'bottom', 'left'].map((side) => (
                <div key={side} className="space-y-1">
                  <label className="text-[9px] text-slate-500 capitalize">{side}</label>
                  <input
                    type="number"
                    min="0"
                    value={el.styles.margin[side as keyof BoxModel]}
                    onChange={(e) => handleUpdateBoxModel('margin', side as keyof BoxModel, Number(e.target.value))}
                    className="w-full bg-slate-950 border border-orange-800/30 rounded p-1 text-center text-xs font-mono text-orange-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Colors Fill */}
        {el.type !== 'path' && (
          <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>{el.type === 'icon' ? 'Icon Color' : 'Fill Color'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-850 cursor-pointer shrink-0">
                <input
                  type="color"
                  value={el.styles.fill.startsWith('#') ? el.styles.fill : '#3b82f6'}
                  onChange={(e) => updateElement(el.id, { styles: { ...el.styles, fill: e.target.value } })}
                  className="absolute inset-0 w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer border-none bg-none"
                />
              </div>
              <input
                type="text"
                value={el.styles.fill}
                onChange={(e) => updateElement(el.id, { styles: { ...el.styles, fill: e.target.value } })}
                className="min-w-0 flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
            
            {/* Color Presets */}
            <div className="grid grid-cols-6 gap-1.5 mt-2 bg-slate-950/20 p-2 rounded-lg border border-slate-850">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateElement(el.id, { styles: { ...el.styles, fill: color } })}
                  className="w-full aspect-square rounded border border-slate-800/50 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* 5. Borders */}
        <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Border & Stroke</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Thickness</span>
              <span className="text-slate-300">{el.styles.borderWidth}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={el.styles.borderWidth}
              onChange={(e) => updateElement(el.id, { styles: { ...el.styles, borderWidth: Number(e.target.value) } })}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {el.styles.borderWidth > 0 && (
            <div className="flex items-center gap-3 mt-2 animate-fadeIn">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-850 cursor-pointer shrink-0">
                <input
                  type="color"
                  value={el.styles.borderColor.startsWith('#') ? el.styles.borderColor : '#000000'}
                  onChange={(e) => updateElement(el.id, { styles: { ...el.styles, borderColor: e.target.value } })}
                  className="absolute inset-0 w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer border-none bg-none"
                />
              </div>
              <input
                type="text"
                value={el.styles.borderColor}
                onChange={(e) => updateElement(el.id, { styles: { ...el.styles, borderColor: e.target.value } })}
                className="min-w-0 flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md py-1 px-2 text-xs font-mono text-slate-300"
              />
            </div>
          )}
        </div>

        {/* 6. Corner rounding */}
        {(el.type === 'rect' || el.type === 'container') && (
          <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span className="font-semibold">Corner Rounding</span>
              <span className="text-slate-300 font-mono">{el.styles.borderRadius ?? 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={el.styles.borderRadius ?? 0}
              onChange={(e) => updateElement(el.id, { styles: { ...el.styles, borderRadius: Number(e.target.value) } })}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {/* 7. Opacity */}
        <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span className="font-semibold">Opacity</span>
            <span className="text-slate-300 font-mono">{Math.round(el.styles.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={el.styles.opacity}
            onChange={(e) => updateElement(el.id, { styles: { ...el.styles, opacity: Number(e.target.value) } })}
            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* 8. Layer ordering */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Layer Arrange</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => bringToFront(el.id)}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-slate-300 text-xs font-semibold transition-colors"
            >
              <BringToFront className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase">Bring Front</span>
            </button>
            <button
              onClick={() => sendToBack(el.id)}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-slate-300 text-xs font-semibold transition-colors"
            >
              <SendToBack className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase">Send Back</span>
            </button>
          </div>
        </div>

        {/* 9. Delete Element */}
        <div className="pt-6 border-t border-slate-850">
          <button
            onClick={() => deleteElement(el.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 hover:border-red-600 text-red-400 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Element</span>
          </button>
        </div>
      </div>
    </div>
  );
};
