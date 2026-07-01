import React from 'react';
import { CanvasElement as ElementType, ViewportMode } from '../types';
import { getIconComponent } from '../utils/lucideIcons';
import { useCanvas } from '../context/CanvasContext';

interface CanvasElementProps {
  element: ElementType;
  selectedId: string | null;
  viewport: ViewportMode;
  onSelect: (e: React.PointerEvent, id: string) => void;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  selectedId,
  viewport,
  onSelect
}) => {
  const { activeTool } = useCanvas();
  const isSelected = element.id === selectedId;

  // Resolve responsive value
  const resolve = <T,>(val: { base: T; md?: T; lg?: T }): T => {
    if (viewport === 'desktop' && val.lg !== undefined) return val.lg;
    if (viewport === 'tablet' && val.md !== undefined) return val.md;
    return val.base;
  };

  const x = resolve(element.x);
  const y = resolve(element.y);
  const w = resolve(element.width);
  const h = resolve(element.height);
  const pos = resolve(element.position);

  // Core style mapping
  const s = element.styles;
  const elementStyle: React.CSSProperties = {
    position: pos === 'absolute' ? 'absolute' : 'relative',
    left: pos === 'absolute' ? `${x}px` : undefined,
    top: pos === 'absolute' ? `${y}px` : undefined,
    width: typeof w === 'number' ? `${w}px` : w === 'full' ? '100%' : 'auto',
    height: typeof h === 'number' ? `${h}px` : h === 'full' ? '100%' : 'auto',
    opacity: s.opacity,
    
    // Borders
    border: s.borderWidth > 0 && element.type !== 'triangle' && element.type !== 'icon' && element.type !== 'path'
      ? `${s.borderWidth}px solid ${s.borderColor}` 
      : 'none',
    borderRadius: element.type === 'circle' ? '50%' : s.borderRadius ? `${s.borderRadius}px` : undefined,
    
    // Fill background
    backgroundColor: element.type !== 'icon' && element.type !== 'path' && element.type !== 'triangle' ? s.fill : undefined,
    
    // Margins
    marginTop: `${s.margin.top}px`,
    marginRight: `${s.margin.right}px`,
    marginBottom: `${s.margin.bottom}px`,
    marginLeft: `${s.margin.left}px`,
    
    // Paddings
    paddingTop: `${s.padding.top}px`,
    paddingRight: `${s.padding.right}px`,
    paddingBottom: `${s.padding.bottom}px`,
    paddingLeft: `${s.padding.left}px`,
    
    // Flexbox layouts
    display: element.type === 'container' ? 'flex' : undefined,
    flexDirection: element.type === 'container' ? (s.alignItems ? 'column' : 'row') : undefined,
    gap: element.type === 'container' ? `${s.gap || 16}px` : undefined,
    alignItems: element.type === 'container' ? s.alignItems || 'stretch' : undefined,
    justifyContent: element.type === 'container' ? s.justifyContent || 'start' : undefined,
    
    boxSizing: 'border-box',
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'select') {
      e.stopPropagation();
      onSelect(e, element.id);
    }
  };

  return (
    <div
      id={element.id}
      data-id={element.id}
      data-type={element.type}
      style={elementStyle}
      onPointerDown={handlePointerDown}
      className={`group select-none relative ${
        isSelected 
          ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-950 z-30' 
          : 'hover:ring-1 hover:ring-slate-700/80 hover:z-20'
      } transition-shadow duration-100`}
    >
      
      {/* 1. Rectangle container contents */}
      {element.type === 'container' && element.children && (
        element.children.map((child) => (
          <CanvasElement
            key={child.id}
            element={child}
            selectedId={selectedId}
            viewport={viewport}
            onSelect={onSelect}
          />
        ))
      )}

      {/* 2. Triangle rendering */}
      {element.type === 'triangle' && (
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="50,0 100,100 0,100"
            fill={s.fill}
            stroke={s.borderColor}
            strokeWidth={s.borderWidth}
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* 3. Icon rendering */}
      {element.type === 'icon' && (() => {
        const IconComponent = getIconComponent(element.iconName || 'Star');
        return (
          <IconComponent
            className="w-full h-full"
            style={{ color: s.fill }}
            strokeWidth={s.borderWidth !== undefined ? s.borderWidth : 2}
          />
        );
      })()}

      {/* 4. Pen path rendering */}
      {element.type === 'path' && (
        <svg className="w-full h-full overflow-visible" fill="none">
          <path
            d={element.pathData}
            fill={s.fill || 'none'}
            stroke={s.borderColor}
            strokeWidth={s.borderWidth || 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Helper ID tooltip tag on hover */}
      <div className="absolute top-0.5 right-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        <span className="bg-slate-900/90 text-slate-400 font-mono text-[7px] px-1 py-0.2 rounded border border-slate-800">
          #{element.id}
        </span>
      </div>

    </div>
  );
};
