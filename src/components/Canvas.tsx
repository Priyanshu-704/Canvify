import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, ActiveTool, StyleSettings } from '../types';
import { ICONS_DATA } from '../utils/iconsData';

interface CanvasProps {
  elements: CanvasElement[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  styleSettings: StyleSettings;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement: (element: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedId,
  setSelectedId,
  activeTool,
  setActiveTool,
  styleSettings,
  onUpdateElement,
  onAddElement,
  onDeleteElement
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Interactive pointer state
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragStart, setDragStart] = useState<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);
  
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'none' | 'drag' | 'resize' | 'create' | 'draw'>('none');
  
  // Custom draw points for Pen Tool
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  
  // Shape creation coordinates
  const [createStart, setCreateStart] = useState<{ x: number; y: number } | null>(null);
  const [tempCreateElement, setTempCreateElement] = useState<CanvasElement | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Keyboard nudge & delete listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      
      // Prevent scrolling on space / arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(e.key)) {
        // Only run if not typing in inputs (Monaco has its own listener)
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
      }

      const step = e.shiftKey ? 10 : 1;
      const element = elements.find(el => el.id === selectedId);
      if (!element) return;

      if (e.key === 'ArrowLeft') {
        onUpdateElement(selectedId, { x: element.x - step });
      } else if (e.key === 'ArrowRight') {
        onUpdateElement(selectedId, { x: element.x + step });
      } else if (e.key === 'ArrowUp') {
        onUpdateElement(selectedId, { y: element.y - step });
      } else if (e.key === 'ArrowDown') {
        onUpdateElement(selectedId, { y: element.y + step });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteElement(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, onUpdateElement, onDeleteElement]);

  // Translate screen mouse coordinates to canvas coordinates
  const getCanvasCoords = (e: React.PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    
    // Set pointer capture to lock events to this element
    canvasRef.current.setPointerCapture(e.pointerId);
    
    const coords = getCanvasCoords(e);
    setIsPointerDown(true);

    if (activeTool === 'select') {
      // 1. Check if user clicked a resize handle
      const target = e.target as HTMLElement;
      const handle = target.getAttribute('data-handle');
      
      if (handle && selectedElement) {
        setResizeHandle(handle);
        setActiveAction('resize');
        setDragStart({
          startX: e.clientX,
          startY: e.clientY,
          origX: selectedElement.x,
          origY: selectedElement.y,
          origW: selectedElement.width,
          origH: selectedElement.height
        });
        e.stopPropagation();
        return;
      }

      // 2. Check if user clicked an element
      const elementId = target.closest('[data-element-id]')?.getAttribute('data-element-id');
      if (elementId) {
        const clickedEl = elements.find((el) => el.id === elementId);
        if (clickedEl) {
          setSelectedId(elementId);
          setActiveAction('drag');
          setDragStart({
            startX: e.clientX,
            startY: e.clientY,
            origX: clickedEl.x,
            origY: clickedEl.y,
            origW: clickedEl.width,
            origH: clickedEl.height
          });
          e.stopPropagation();
          return;
        }
      }

      // 3. Clicked empty space
      setSelectedId(null);
      setActiveAction('none');
    } else if (activeTool === 'draw') {
      // Start Pen Drawing
      setActiveAction('draw');
      setDrawPoints([coords]);
    } else if (['rect', 'circle', 'triangle'].includes(activeTool)) {
      // Start Shape Drag Creation
      setActiveAction('create');
      setCreateStart(coords);
      
      const newTempEl: CanvasElement = {
        id: 'temp-element',
        type: activeTool as any,
        x: coords.x,
        y: coords.y,
        width: 1,
        height: 1,
        fill: styleSettings.fill,
        borderWidth: styleSettings.borderWidth,
        borderColor: styleSettings.borderColor,
        borderRadius: activeTool === 'rect' ? styleSettings.borderRadius : undefined,
        opacity: styleSettings.opacity
      };
      setTempCreateElement(newTempEl);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    const coords = getCanvasCoords(e);

    if (activeAction === 'drag' && selectedId && dragStart) {
      const deltaX = e.clientX - dragStart.startX;
      const deltaY = e.clientY - dragStart.startY;
      onUpdateElement(selectedId, {
        x: dragStart.origX + deltaX,
        y: dragStart.origY + deltaY
      });
    } else if (activeAction === 'resize' && selectedId && selectedElement && dragStart && resizeHandle) {
      const deltaX = e.clientX - dragStart.startX;
      const deltaY = e.clientY - dragStart.startY;
      
      let x = selectedElement.x;
      let y = selectedElement.y;
      let w = selectedElement.width;
      let h = selectedElement.height;

      // Adjust dimensions depending on which handle is dragged
      if (resizeHandle.includes('r')) {
        w = Math.max(10, dragStart.origW + deltaX);
      }
      if (resizeHandle.includes('b')) {
        h = Math.max(10, dragStart.origH + deltaY);
      }
      if (resizeHandle.includes('l')) {
        const potentialW = dragStart.origW - deltaX;
        if (potentialW >= 10) {
          w = potentialW;
          x = dragStart.origX + deltaX;
        }
      }
      if (resizeHandle.includes('t')) {
        const potentialH = dragStart.origH - deltaY;
        if (potentialH >= 10) {
          h = potentialH;
          y = dragStart.origY + deltaY;
        }
      }

      onUpdateElement(selectedId, { x, y, width: w, height: h });
    } else if (activeAction === 'draw') {
      // Add points for custom path drawing
      setDrawPoints((prev) => [...prev, coords]);
    } else if (activeAction === 'create' && createStart && tempCreateElement) {
      // Dynamic scaling for shape creation
      const startX = createStart.x;
      const startY = createStart.y;
      const currentX = coords.x;
      const currentY = coords.y;

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.max(2, Math.abs(startX - currentX));
      const height = Math.max(2, Math.abs(startY - currentY));

      setTempCreateElement({
        ...tempCreateElement,
        x,
        y,
        width,
        height
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    
    // Release pointer capture
    if (canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
    
    setIsPointerDown(false);

    if (activeAction === 'draw' && drawPoints.length > 2) {
      // Finalize Pen tool path
      const xs = drawPoints.map((p) => p.x);
      const ys = drawPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const width = Math.max(4, maxX - minX);
      const height = Math.max(4, maxY - minY);

      // Normalize coordinates relative to path bounding box
      const relPoints = drawPoints.map((p) => ({
        x: p.x - minX,
        y: p.y - minY
      }));

      // Generate SVG Path data d property
      const pathData = `M ${relPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;

      const newElement: CanvasElement = {
        id: `draw-${Date.now()}`,
        type: 'path',
        x: minX,
        y: minY,
        width,
        height,
        fill: 'none',
        borderWidth: styleSettings.borderWidth > 0 ? styleSettings.borderWidth : 3,
        borderColor: styleSettings.borderColor,
        opacity: styleSettings.opacity,
        pathData
      };

      onAddElement(newElement);
      setSelectedId(newElement.id);
      setActiveTool('select'); // Automatically toggle back to selection tool
    } else if (activeAction === 'create' && tempCreateElement) {
      // Place shape onto canvas
      // If width or height are extremely tiny (accidental clicks), place a default size
      const isTiny = tempCreateElement.width <= 5 || tempCreateElement.height <= 5;
      
      const newElement: CanvasElement = {
        ...tempCreateElement,
        id: `${tempCreateElement.type}-${Date.now()}`,
        width: isTiny ? 120 : tempCreateElement.width,
        height: isTiny ? 120 : tempCreateElement.height,
        x: isTiny ? tempCreateElement.x - 60 : tempCreateElement.x,
        y: isTiny ? tempCreateElement.y - 60 : tempCreateElement.y
      };

      onAddElement(newElement);
      setSelectedId(newElement.id);
      setActiveTool('select');
    }

    setDrawPoints([]);
    setTempCreateElement(null);
    setCreateStart(null);
    setResizeHandle(null);
    setActiveAction('none');
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950">
      {/* Canvas Top Bar Info */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 select-none shrink-0">
        <span className="text-xs font-semibold text-slate-400 tracking-wider">WORKSPACE CANVAS</span>
        <div className="flex gap-2">
          {activeTool !== 'select' && (
            <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-md font-medium animate-pulse">
              {activeTool === 'draw' ? '🖋️ Click & Drag to free-draw' : '🎯 Click & Drag to place shape'}
            </span>
          )}
          <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-md font-medium">
            {elements.length} {elements.length === 1 ? 'element' : 'elements'}
          </span>
        </div>
      </div>

      {/* Interactive Board Wrapper */}
      <div className="flex-1 relative overflow-hidden bg-slate-950">
        <div
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 canvas-grid cursor-crosshair select-none touch-none"
          style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        >
          {/* Elements Rendering Loop */}
          {elements.map((el) => {
            const isSelected = el.id === selectedId;
            const elementStyle: React.CSSProperties = {
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              opacity: el.opacity,
              pointerEvents: activeTool === 'select' ? 'auto' : 'none'
            };

            return (
              <div
                key={el.id}
                data-element-id={el.id}
                style={elementStyle}
                className={`transition-shadow duration-100 ${
                  isSelected && activeTool === 'select' ? 'z-50' : 'z-10'
                }`}
              >
                {/* Rect Rendering */}
                {el.type === 'rect' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: el.fill,
                      border: el.borderWidth > 0 ? `${el.borderWidth}px solid ${el.borderColor}` : 'none',
                      borderRadius: `${el.borderRadius ?? 0}px`
                    }}
                  />
                )}

                {/* Circle Rendering */}
                {el.type === 'circle' && (
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      backgroundColor: el.fill,
                      border: el.borderWidth > 0 ? `${el.borderWidth}px solid ${el.borderColor}` : 'none'
                    }}
                  />
                )}

                {/* Triangle Rendering */}
                {el.type === 'triangle' && (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon
                      points="50,0 100,100 0,100"
                      fill={el.fill}
                      stroke={el.borderColor}
                      strokeWidth={el.borderWidth}
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {/* Icon Rendering */}
                {el.type === 'icon' && (
                  <svg
                    className="w-full h-full"
                    style={{ color: el.fill }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={el.borderWidth}
                    strokeLinecap="round"
                    stroke-linejoin="round"
                    dangerouslySetInnerHTML={{ __html: ICONS_DATA[el.iconName || 'Star'] || '' }}
                  />
                )}

                {/* Drawn Path Rendering */}
                {el.type === 'path' && (
                  <svg className="w-full h-full overflow-visible" fill="none">
                    <path
                      d={el.pathData}
                      stroke={el.borderColor}
                      strokeWidth={el.borderWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}

          {/* Render Temporary Custom Path during Drawing */}
          {activeAction === 'draw' && drawPoints.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <path
                d={`M ${drawPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`}
                stroke={styleSettings.borderColor}
                strokeWidth={styleSettings.borderWidth > 0 ? styleSettings.borderWidth : 3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={styleSettings.opacity}
              />
            </svg>
          )}

          {/* Render Temporary Shape during Creation Drag */}
          {activeAction === 'create' && tempCreateElement && (
            <div
              style={{
                position: 'absolute',
                left: tempCreateElement.x,
                top: tempCreateElement.y,
                width: tempCreateElement.width,
                height: tempCreateElement.height,
                opacity: tempCreateElement.opacity,
                pointerEvents: 'none'
              }}
            >
              {tempCreateElement.type === 'rect' && (
                <div
                  className="w-full h-full border-2 border-indigo-500/50 bg-indigo-500/20"
                  style={{ borderRadius: `${tempCreateElement.borderRadius ?? 0}px` }}
                />
              )}
              {tempCreateElement.type === 'circle' && (
                <div className="w-full h-full rounded-full border-2 border-indigo-500/50 bg-indigo-500/20" />
              )}
              {tempCreateElement.type === 'triangle' && (
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon
                    points="50,0 100,100 0,100"
                    fill="rgba(99, 102, 241, 0.2)"
                    stroke="rgba(99, 102, 241, 0.5)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}

          {/* Render 8-point Selection Box & Resize Handles */}
          {selectedElement && activeTool === 'select' && (
            <div
              style={{
                position: 'absolute',
                left: selectedElement.x,
                top: selectedElement.y,
                width: selectedElement.width,
                height: selectedElement.height,
                border: '1.5px dashed #6366f1',
                pointerEvents: 'none',
                boxSizing: 'border-box'
              }}
              className="z-[60]"
            >
              {/* Selection Border Inner Glow */}
              <div className="absolute inset-0 border border-indigo-500/20 pointer-events-none" />

              {/* 8 resize handle elements */}
              {['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'].map((pos) => {
                let positionStyle: React.CSSProperties = {};
                let cursorStyle = 'default';

                switch (pos) {
                  case 'tl':
                    positionStyle = { top: -5, left: -5 };
                    cursorStyle = 'nwse-resize';
                    break;
                  case 't':
                    positionStyle = { top: -5, left: 'calc(50% - 5px)' };
                    cursorStyle = 'ns-resize';
                    break;
                  case 'tr':
                    positionStyle = { top: -5, right: -5 };
                    cursorStyle = 'nesw-resize';
                    break;
                  case 'r':
                    positionStyle = { top: 'calc(50% - 5px)', right: -5 };
                    cursorStyle = 'ew-resize';
                    break;
                  case 'br':
                    positionStyle = { bottom: -5, right: -5 };
                    cursorStyle = 'nwse-resize';
                    break;
                  case 'b':
                    positionStyle = { bottom: -5, left: 'calc(50% - 5px)' };
                    cursorStyle = 'ns-resize';
                    break;
                  case 'bl':
                    positionStyle = { bottom: -5, left: -5 };
                    cursorStyle = 'nesw-resize';
                    break;
                  case 'l':
                    positionStyle = { top: 'calc(50% - 5px)', left: -5 };
                    cursorStyle = 'ew-resize';
                    break;
                }

                return (
                  <div
                    key={pos}
                    data-handle={pos}
                    style={{
                      ...positionStyle,
                      position: 'absolute',
                      width: 10,
                      height: 10,
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #6366f1',
                      borderRadius: '2px',
                      cursor: cursorStyle,
                      pointerEvents: 'auto'
                    }}
                    className="shadow-sm hover:bg-indigo-500 hover:scale-125 transition-transform"
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
