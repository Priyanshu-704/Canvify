import React from 'react';
import { CanvasElement, ViewportMode } from '../types';

interface BoxModelOverlayProps {
  element: CanvasElement;
  viewport: ViewportMode;
}

export const BoxModelOverlay: React.FC<BoxModelOverlayProps> = ({ element, viewport }) => {
  const m = element.styles.margin;
  const p = element.styles.padding;
  
  // Resolve geometry for viewport
  const resolve = <T,>(val: { base: T; md?: T; lg?: T }): T => {
    if (viewport === 'desktop' && val.lg !== undefined) return val.lg;
    if (viewport === 'tablet' && val.md !== undefined) return val.md;
    return val.base;
  };

  const x = resolve(element.x);
  const y = resolve(element.y);
  const w = resolve(element.width);
  const h = resolve(element.height);

  // If dimensions are strings (e.g. 'full' / 'auto'), we default to standard box size for overlays
  const widthNum = typeof w === 'number' ? w : 200;
  const heightNum = typeof h === 'number' ? h : 150;

  // Concentric absolute box dimensions
  const marginWidth = widthNum + m.left + m.right;
  const marginHeight = heightNum + m.top + m.bottom;

  const paddingWidth = Math.max(0, widthNum - p.left - p.right);
  const paddingHeight = Math.max(0, heightNum - p.top - p.bottom);

  return (
    <div
      style={{
        position: 'absolute',
        left: x - m.left,
        top: y - m.top,
        width: marginWidth,
        height: marginHeight,
        pointerEvents: 'none',
        zIndex: 40,
      }}
      className="animate-fadeIn"
    >
      {/* 1. Margin Outer Box (Orange) */}
      <div className="absolute inset-0 border border-dashed border-orange-500 bg-orange-500/10 rounded-lg flex flex-col justify-between p-0.5">
        <div className="flex justify-between items-start">
          <span className="bg-orange-600 text-white font-mono text-[8px] px-1 rounded shadow-sm">
            margin
          </span>
          <span className="font-mono text-[8px] text-orange-400 font-semibold">
            {m.top}px
          </span>
          <span></span>
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="font-mono text-[8px] text-orange-400 font-semibold">{m.left}px</span>
          <span className="font-mono text-[8px] text-orange-400 font-semibold">{m.right}px</span>
        </div>
        <div className="flex justify-center items-end">
          <span className="font-mono text-[8px] text-orange-400 font-semibold">
            {m.bottom}px
          </span>
        </div>
      </div>

      {/* 2. Border Box (Yellow) */}
      <div
        style={{
          position: 'absolute',
          left: m.left,
          top: m.top,
          width: widthNum,
          height: heightNum,
        }}
        className="border border-yellow-500 bg-yellow-500/10 rounded"
      >
        <span className="absolute top-0.5 left-0.5 bg-yellow-600 text-white font-mono text-[8px] px-1 rounded shadow-sm">
          border ({element.styles.borderWidth}px)
        </span>

        {/* 3. Padding Box (Green) */}
        <div
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: paddingWidth,
            height: paddingHeight,
          }}
          className="border border-emerald-500 bg-emerald-500/10 flex flex-col justify-between p-0.5"
        >
          <div className="flex justify-between items-start">
            <span className="bg-emerald-600 text-white font-mono text-[8px] px-1 rounded shadow-sm">
              padding
            </span>
            <span className="font-mono text-[8px] text-emerald-400 font-semibold">
              {p.top}px
            </span>
            <span></span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="font-mono text-[8px] text-emerald-400 font-semibold">{p.left}px</span>
            {/* Center Bounding Box Dimensions */}
            <span className="bg-slate-900/90 text-slate-100 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-700">
              {widthNum} × {heightNum}
            </span>
            <span className="font-mono text-[8px] text-emerald-400 font-semibold">{p.right}px</span>
          </div>
          <div className="flex justify-center items-end">
            <span className="font-mono text-[8px] text-emerald-400 font-semibold">
              {p.bottom}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
