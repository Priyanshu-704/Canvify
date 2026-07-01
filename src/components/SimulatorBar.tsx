import React, { useState, useEffect, useRef } from 'react';
import { 
  Laptop, 
  Tablet, 
  Smartphone, 
  Undo2, 
  Redo2, 
  Clock,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';

export const SimulatorBar: React.FC = () => {
  const {
    viewportMode,
    setViewportMode,
    history,
    historyIndex,
    undo,
    redo,
    jumpToHistory,
    boxModelActive,
    setBoxModelActive,
    showEditor,
    setShowEditor,
    showSidebar,
    setShowSidebar
  } = useCanvas();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // ResizeObserver to detect workspace width changes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  const isCompact = containerWidth < 520;
  const isUltraCompact = containerWidth < 380;

  const viewports = [
    { mode: 'mobile', icon: Smartphone, label: 'Mobile View (375px)' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet View (768px)' },
    { mode: 'desktop', icon: Laptop, label: 'Desktop View (Adaptive)' },
  ] as const;

  return (
    <div 
      ref={containerRef} 
      className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 shrink-0 select-none z-20 gap-2 overflow-hidden w-full"
    >
      
      {/* 0. Sidebar Collapse/Expand Toggle */}
      <div className="relative group shrink-0">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`flex items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
            showSidebar
              ? 'border-slate-800 bg-slate-950/40 text-slate-350 hover:text-slate-100 hover:border-slate-700'
              : 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400 shadow shadow-indigo-600/5'
          }`}
          title={showSidebar ? "Collapse Left Sidebar" : "Expand Left Sidebar"}
        >
          {showSidebar ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
          )}
        </button>
        {/* Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-35 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
          <div className="w-2 h-2 bg-slate-850 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
          <div className="bg-slate-850 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
            {showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
          </div>
        </div>
      </div>

      {/* 1. Viewport Selectors */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 shrink-0">
        {viewports.map((vp) => {
          const Icon = vp.icon;
          const isActive = viewportMode === vp.mode;
          const showLabel = !isCompact || (viewportMode === vp.mode && !isUltraCompact);
          return (
            <div key={vp.mode} className="relative group">
              <button
                onClick={() => setViewportMode(vp.mode)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/20'
                    : 'text-slate-350 hover:text-indigo-400 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {showLabel && (
                  <span className="text-[10px] capitalize tracking-wide">{vp.mode}</span>
                )}
              </button>

              {/* Premium Animated Downward Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-30 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
                <div className="w-2 h-2 bg-slate-850 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
                <div className="bg-slate-850 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
                  {vp.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. History & Time Travel Controls */}
      {isUltraCompact ? (
        // Ultra Compact View: Simple Undo/Redo Buttons
        <div className="flex items-center gap-1 shrink-0 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <div className="relative group">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className={`p-1.5 rounded-md transition-all ${
                historyIndex === 0 
                  ? 'text-slate-600 opacity-25 cursor-not-allowed'
                  : 'text-slate-330 hover:text-indigo-400 hover:bg-slate-900/80'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-30 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
              <div className="w-2 h-2 bg-slate-850 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
              <div className="bg-slate-850 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
                Undo State
              </div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className={`p-1.5 rounded-md transition-all ${
                historyIndex === history.length - 1
                  ? 'text-slate-600 opacity-25 cursor-not-allowed'
                  : 'text-slate-330 hover:text-indigo-400 hover:bg-slate-900/80'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-30 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
              <div className="w-2 h-2 bg-slate-850 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
              <div className="bg-slate-850 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
                Redo State
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Regular / Compact View
        <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex-1 min-w-0 max-w-md">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs shrink-0 font-semibold min-w-0">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {!isCompact && (
              <span className="text-[10px] tracking-wide text-slate-500 uppercase font-bold">History:</span>
            )}
            <span className="font-mono text-indigo-300 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded text-[9px] shrink-0 border border-indigo-500/20">
              {historyIndex + 1}/{history.length}
            </span>
          </div>
          
          <div className="flex items-center gap-1 shrink-0 border-r border-slate-800/60 pr-1.5 sm:pr-2">
            <div className="relative group">
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className={`p-1 rounded-md transition-all ${
                  historyIndex === 0 
                    ? 'text-slate-650 opacity-25 cursor-not-allowed'
                    : 'text-slate-350 hover:text-indigo-400 hover:bg-slate-900/60'
                }`}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-30 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
                <div className="w-2 h-2 bg-slate-855 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
                <div className="bg-slate-855 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
                  Undo State
                </div>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className={`p-1 rounded-md transition-all ${
                  historyIndex === history.length - 1
                    ? 'text-slate-655 opacity-25 cursor-not-allowed'
                    : 'text-slate-350 hover:text-indigo-400 hover:bg-slate-900/60'
                }`}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-30 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
                <div className="w-2 h-2 bg-slate-850 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
                <div className="bg-slate-850 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
                  Redo State
                </div>
              </div>
            </div>
          </div>

          {/* Scrub Slider - hidden on compact screens */}
          {!isCompact && (
            <input
              type="range"
              min="0"
              max={Math.max(0, history.length - 1)}
              value={historyIndex}
              onChange={(e) => jumpToHistory(Number(e.target.value))}
              className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 min-w-[50px]"
            />
          )}
        </div>
      )}

      {/* 3. Toggle Control Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Box Model Toggle */}
        <div className="relative group">
          <button
            onClick={() => setBoxModelActive(!boxModelActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
              boxModelActive
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow shadow-amber-500/5'
                : 'border-slate-800 bg-slate-950/40 text-slate-350 hover:text-slate-100 hover:border-slate-700'
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {boxModelActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${boxModelActive ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
            </span>
            {!isCompact && <span className="text-[10px] uppercase">Box Overlay</span>}
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-35 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
            <div className="w-2 h-2 bg-slate-850 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
            <div className="bg-slate-850 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
              {boxModelActive ? 'Disable Box Outline Mode' : 'Enable Box Outline Mode'}
            </div>
          </div>
        </div>

        {/* Editor Show/Hide Toggle */}
        <div className="relative group">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
              showEditor
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow shadow-indigo-500/5'
                : 'border-slate-800 bg-slate-950/40 text-slate-350 hover:text-slate-100 hover:border-slate-700'
            }`}
          >
            {showEditor ? <EyeOff className="w-3.5 h-3.5 shrink-0" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
            {!isCompact && (
              <span className="text-[10px] uppercase">{showEditor ? "Hide Editor" : "Show Editor"}</span>
            )}
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-35 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-top flex flex-col items-center">
            <div className="w-2 h-2 bg-slate-850 border-l border-t border-slate-700 rotate-45 -mb-1 z-40" />
            <div className="bg-slate-850 text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap tracking-wide">
              {showEditor ? 'Hide Monaco Code Editor' : 'Show Monaco Code Editor'}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
