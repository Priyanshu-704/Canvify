import React, { useRef, useState, useEffect } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { CanvasElement } from './CanvasElement';
import { BoxModelOverlay } from './BoxModelOverlay';
import { CanvasElement as ElementType } from '../types';

export const Canvas: React.FC = () => {
  const {
    elements,
    selectedId,
    setSelectedId,
    activeTool,
    setActiveTool,
    viewportMode,
    pan,
    setPan,
    zoom,
    setZoom,
    boxModelActive,
    styleSettings,
    updateElement,
    addElement,
    deleteElement,
    nestElement
  } = useCanvas();

  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging, drawing, and resizing states
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragStart, setDragStart] = useState<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const [activeAction, setActiveAction] = useState<'none' | 'drag' | 'resize' | 'create' | 'draw' | 'pan'>('none');
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [createStart, setCreateStart] = useState<{ x: number; y: number } | null>(null);
  const [tempCreateElement, setTempCreateElement] = useState<ElementType | null>(null);
  const [hoverParentId, setHoverParentId] = useState<string | null>(null);

  // Dynamic selection overlay rectangle
  const [selectRect, setSelectRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // 1. Follow selection overlay bounding box
  useEffect(() => {
    if (!selectedId || !canvasRef.current) {
      setSelectRect(null);
      return;
    }

    const updateRect = () => {
      const elDom = document.getElementById(selectedId);
      const canvasDom = canvasRef.current;
      if (elDom && canvasDom) {
        const elRect = elDom.getBoundingClientRect();
        const canvasRect = canvasDom.getBoundingClientRect();
        setSelectRect({
          x: (elRect.left - canvasRect.left) / zoom,
          y: (elRect.top - canvasRect.top) / zoom,
          w: elRect.width / zoom,
          h: elRect.height / zoom
        });
      }
    };

    updateRect();

    let active = true;
    const loop = () => {
      if (!active) return;
      updateRect();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      active = false;
    };
  }, [selectedId, elements, zoom, pan]);

  // Keyboard nudging / deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      
      const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isInput) return;

      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }

      const el = findElementById(elements, selectedId);
      if (!el) return;

      const step = e.shiftKey ? 10 : 1;
      
      // Resolve geometry values
      const resolve = <T,>(val: { base: T; md?: T; lg?: T }): T => {
        if (viewportMode === 'desktop' && val.lg !== undefined) return val.lg;
        if (viewportMode === 'tablet' && val.md !== undefined) return val.md;
        return val.base;
      };

      const x = resolve(el.x);
      const y = resolve(el.y);

      const setResponsive = <T,>(valObj: { base: T; md?: T; lg?: T }, val: T) => {
        if (viewportMode === 'desktop') valObj.lg = val;
        else if (viewportMode === 'tablet') valObj.md = val;
        else valObj.base = val;
      };

      if (e.key === 'ArrowLeft') {
        const newX = { ...el.x };
        setResponsive(newX, x - step);
        updateElement(selectedId, { x: newX });
      } else if (e.key === 'ArrowRight') {
        const newX = { ...el.x };
        setResponsive(newX, x + step);
        updateElement(selectedId, { x: newX });
      } else if (e.key === 'ArrowUp') {
        const newY = { ...el.y };
        setResponsive(newY, y - step);
        updateElement(selectedId, { y: newY });
      } else if (e.key === 'ArrowDown') {
        const newY = { ...el.y };
        setResponsive(newY, y + step);
        updateElement(selectedId, { y: newY });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteElement(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, viewportMode]);

  const findElementById = (tree: ElementType[], id: string): ElementType | null => {
    for (const el of tree) {
      if (el.id === id) return el;
      if (el.children) {
        const res = findElementById(el.children, id);
        if (res) return res;
      }
    }
    return null;
  };

  // Helper to check if a potential container is a child/descendant of target
  const isDescendant = (parent: ElementType, childId: string): boolean => {
    if (!parent.children) return false;
    if (parent.children.some((c) => c.id === childId)) return true;
    return parent.children.some((c) => isDescendant(c, childId));
  };

  // Coordinates translation projection
  const getCanvasCoords = (e: React.PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  };

  // Trackpad / Wheel Pan & Zoom Gesture Listener
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Math coordinates relative to zoom origins
      const zoomFactor = 1.08;
      const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      const boundedZoom = Math.max(0.15, Math.min(4.0, nextZoom));
      
      setZoom(boundedZoom);
    } else {
      // Pan
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Pointer Down operations
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    canvasRef.current.setPointerCapture(e.pointerId);

    const coords = getCanvasCoords(e);
    setIsPointerDown(true);

    // Canvas panning triggers: middle click, or left-click background/empty space in select mode
    const target = e.target as HTMLElement;
    const isCanvasBg = target.classList.contains('canvas-grid') || target.id === 'canvas-wrapper';
    const isMiddleClick = e.button === 1;
    const shouldPanBg = isCanvasBg && activeTool === 'select';

    if (isMiddleClick || shouldPanBg || (activeTool === 'draw' && e.shiftKey)) {
      setActiveAction('pan');
      setDragStart({
        startX: e.clientX,
        startY: e.clientY,
        origX: pan.x,
        origY: pan.y,
        origW: 0,
        origH: 0
      });
      return;
    }

    if (activeTool === 'select') {
      const handle = target.getAttribute('data-handle');
      if (handle && selectedId) {
        // Start Resize Action
        const el = findElementById(elements, selectedId);
        if (el) {
          const resolve = <T,>(val: { base: T; md?: T; lg?: T }): T => {
            if (viewportMode === 'desktop' && val.lg !== undefined) return val.lg;
            if (viewportMode === 'tablet' && val.md !== undefined) return val.md;
            return val.base;
          };
          
          setActiveAction('resize');
          setResizeHandle(handle);
          setDragStart({
            startX: e.clientX,
            startY: e.clientY,
            origX: resolve(el.x),
            origY: resolve(el.y),
            origW: typeof resolve(el.width) === 'number' ? (resolve(el.width) as number) : 100,
            origH: typeof resolve(el.height) === 'number' ? (resolve(el.height) as number) : 100
          });
        }
        e.stopPropagation();
        return;
      }

      // Check if user clicked an element
      const elementId = target.closest('[data-id]')?.getAttribute('data-id');
      if (elementId && elementId !== 'canvas-wrapper') {
        const el = findElementById(elements, elementId);
        if (el) {
          const resolve = <T,>(val: { base: T; md?: T; lg?: T }): T => {
            if (viewportMode === 'desktop' && val.lg !== undefined) return val.lg;
            if (viewportMode === 'tablet' && val.md !== undefined) return val.md;
            return val.base;
          };

          setSelectedId(elementId);
          setActiveAction('drag');
          setDragStart({
            startX: e.clientX,
            startY: e.clientY,
            origX: resolve(el.x),
            origY: resolve(el.y),
            origW: typeof resolve(el.width) === 'number' ? (resolve(el.width) as number) : 100,
            origH: typeof resolve(el.height) === 'number' ? (resolve(el.height) as number) : 100
          });
        }
        e.stopPropagation();
        return;
      }

      // Empty click clears selection
      setSelectedId(null);
      setActiveAction('none');
    } else if (activeTool === 'draw') {
      setActiveAction('draw');
      setDrawPoints([coords]);
    } else if (['rect', 'circle', 'triangle', 'container'].includes(activeTool)) {
      setActiveAction('create');
      setCreateStart(coords);

      const newTemp: ElementType = {
        id: 'temp-element',
        type: activeTool as any,
        x: { base: coords.x },
        y: { base: coords.y },
        width: { base: 1 },
        height: { base: 1 },
        position: { base: 'absolute' },
        styles: {
          fill: styleSettings.fill,
          borderColor: styleSettings.borderColor,
          borderWidth: styleSettings.borderWidth,
          borderRadius: activeTool === 'rect' || activeTool === 'container' ? styleSettings.borderRadius : undefined,
          opacity: styleSettings.opacity,
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        children: activeTool === 'container' ? [] : undefined
      };
      setTempCreateElement(newTemp);
    }
  };

  // Pointer Move operations
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    const coords = getCanvasCoords(e);

    if (activeAction === 'pan' && dragStart) {
      const dx = e.clientX - dragStart.startX;
      const dy = e.clientY - dragStart.startY;
      setPan({
        x: dragStart.origX + dx,
        y: dragStart.origY + dy
      });
    } else if (activeAction === 'drag' && selectedId && dragStart) {
      const dx = (e.clientX - dragStart.startX) / zoom;
      const dy = (e.clientY - dragStart.startY) / zoom;
      const el = findElementById(elements, selectedId);

      if (el) {
        const newX = { ...el.x };
        const newY = { ...el.y };
        
        const setResponsive = <T,>(valObj: { base: T; md?: T; lg?: T }, val: T) => {
          if (viewportMode === 'desktop') valObj.lg = val;
          else if (viewportMode === 'tablet') valObj.md = val;
          else valObj.base = val;
        };

        setResponsive(newX, Math.round(dragStart.origX + dx));
        setResponsive(newY, Math.round(dragStart.origY + dy));
        updateElement(selectedId, { x: newX, y: newY });

        // Nesting hover target observer
        const domElements = document.elementsFromPoint(e.clientX, e.clientY);
        let potentialParentId: string | null = null;

        for (const domEl of domElements) {
          const pid = domEl.closest('[data-id]')?.getAttribute('data-id');
          if (pid && pid !== selectedId && pid !== 'canvas-wrapper') {
            const pNode = findElementById(elements, pid);
            if (pNode && pNode.type === 'container' && !isDescendant(findElementById(elements, selectedId)!, pid)) {
              potentialParentId = pid;
              break;
            }
          }
        }
        setHoverParentId(potentialParentId);
      }
    } else if (activeAction === 'resize' && selectedId && dragStart) {
      const dx = (e.clientX - dragStart.startX) / zoom;
      const dy = (e.clientY - dragStart.startY) / zoom;
      const el = findElementById(elements, selectedId);

      if (el && resizeHandle) {
        const newX = { ...el.x };
        const newY = { ...el.y };
        const newW = { ...el.width };
        const newH = { ...el.height };

        let w = dragStart.origW;
        let h = dragStart.origH;
        let x = dragStart.origX;
        let y = dragStart.origY;

        if (resizeHandle.includes('r')) w = Math.max(10, dragStart.origW + dx);
        if (resizeHandle.includes('b')) h = Math.max(10, dragStart.origH + dy);
        if (resizeHandle.includes('l')) {
          const pw = dragStart.origW - dx;
          if (pw >= 10) {
            w = pw;
            x = dragStart.origX + dx;
          }
        }
        if (resizeHandle.includes('t')) {
          const ph = dragStart.origH - dy;
          if (ph >= 10) {
            h = ph;
            y = dragStart.origY + dy;
          }
        }

        const setResponsive = <T,>(valObj: { base: T; md?: T; lg?: T }, val: T) => {
          if (viewportMode === 'desktop') valObj.lg = val;
          else if (viewportMode === 'tablet') valObj.md = val;
          else valObj.base = val;
        };

        setResponsive(newX, Math.round(x));
        setResponsive(newY, Math.round(y));
        setResponsive(newW, Math.round(w));
        setResponsive(newH, Math.round(h));

        updateElement(selectedId, { x: newX, y: newY, width: newW, height: newH });
      }
    } else if (activeAction === 'draw') {
      setDrawPoints((prev) => [...prev, coords]);
    } else if (activeAction === 'create' && createStart && tempCreateElement) {
      const dx = coords.x - createStart.x;
      const dy = coords.y - createStart.y;

      const w = Math.max(2, Math.abs(dx));
      const h = Math.max(2, Math.abs(dy));
      const x = Math.min(createStart.x, coords.x);
      const y = Math.min(createStart.y, coords.y);

      setTempCreateElement({
        ...tempCreateElement,
        x: { base: Math.round(x) },
        y: { base: Math.round(y) },
        width: { base: Math.round(w) },
        height: { base: Math.round(h) }
      });
    }
  };

  // Pointer Up operations
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    if (canvasRef.current) canvasRef.current.releasePointerCapture(e.pointerId);
    setIsPointerDown(false);

    if (activeAction === 'drag' && selectedId && dragStart) {
      // Finalize drop nesting parent-child transitions
      const resolve = <T,>(val: { base: T; md?: T; lg?: T }): T => {
        if (viewportMode === 'desktop' && val.lg !== undefined) return val.lg;
        if (viewportMode === 'tablet' && val.md !== undefined) return val.md;
        return val.base;
      };

      const el = findElementById(elements, selectedId);
      if (el) {
        const dropX = resolve(el.x);
        const dropY = resolve(el.y);
        nestElement(selectedId, hoverParentId, dropX, dropY, canvasRef.current);
      }
      setHoverParentId(null);
    } else if (activeAction === 'draw' && drawPoints.length > 2) {
      const xs = drawPoints.map((p) => p.x);
      const ys = drawPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const w = Math.max(4, maxX - minX);
      const h = Math.max(4, maxY - minY);

      const localPoints = drawPoints.map((p) => ({
        x: p.x - minX,
        y: p.y - minY
      }));
      const pathData = `M ${localPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;

      const newPath: ElementType = {
        id: `path-${Date.now()}`,
        type: 'path',
        x: { base: Math.round(minX) },
        y: { base: Math.round(minY) },
        width: { base: Math.round(w) },
        height: { base: Math.round(h) },
        position: { base: 'absolute' },
        styles: {
          fill: 'transparent',
          borderColor: styleSettings.borderColor,
          borderWidth: styleSettings.borderWidth || 3,
          opacity: styleSettings.opacity,
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        pathData
      };
      
      addElement(newPath);
      setSelectedId(newPath.id);
      setActiveTool('select');
    } else if (activeAction === 'create' && tempCreateElement) {
      const resolve = <T,>(val: { base: T; md?: T; lg?: T }): T => {
        if (viewportMode === 'desktop' && val.lg !== undefined) return val.lg;
        if (viewportMode === 'tablet' && val.md !== undefined) return val.md;
        return val.base;
      };

      const w = resolve(tempCreateElement.width) as number;
      const h = resolve(tempCreateElement.height) as number;
      const isTiny = w <= 5 || h <= 5;

      const finalX = isTiny ? resolve(tempCreateElement.x) - 60 : resolve(tempCreateElement.x);
      const finalY = isTiny ? resolve(tempCreateElement.y) - 60 : resolve(tempCreateElement.y);

      const newEl: ElementType = {
        ...tempCreateElement,
        id: `${tempCreateElement.type}-${Date.now()}`,
        width: { base: isTiny ? 120 : w },
        height: { base: isTiny ? 120 : h },
        x: { base: finalX },
        y: { base: finalY }
      };

      addElement(newEl);
      setSelectedId(newEl.id);
      setActiveTool('select');
    }

    setDrawPoints([]);
    setTempCreateElement(null);
    setCreateStart(null);
    setResizeHandle(null);
    setActiveAction('none');
  };

  // Viewport simulator dimensions
  const getViewportWidth = () => {
    if (viewportMode === 'mobile') return '375px';
    if (viewportMode === 'tablet') return '768px';
    return '100%';
  };

  return (
    <div
      ref={workspaceRef}
      onWheel={handleWheel}
      className="flex-1 h-full relative overflow-hidden bg-slate-950 flex items-center justify-center p-6 select-none touch-none"
    >
      {/* Centered responsive frame viewport wrapper */}
      <div
        id="canvas-wrapper"
        style={{
          width: getViewportWidth(),
          maxWidth: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: activeAction === 'none' ? 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
        className="relative bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl flex-shrink-0"
      >
        <div
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            cursor: activeAction === 'pan' ? 'grabbing' : activeTool === 'select' ? 'default' : 'crosshair'
          }}
          className="absolute inset-0 canvas-grid rounded-2xl overflow-hidden select-none"
        >
          {/* Elements list loop */}
          {elements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              selectedId={selectedId}
              viewport={viewportMode}
              onSelect={handlePointerDown}
            />
          ))}

          {/* Hovering container nesting highlight overlay */}
          {hoverParentId && (
            <div
              id={`nest-highlight-${hoverParentId}`}
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                border: '2px solid #a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                zIndex: 35,
                // Layout resolved coordinates
                ...(() => {
                  const node = document.getElementById(hoverParentId);
                  const canvas = canvasRef.current;
                  if (node && canvas) {
                    const r = node.getBoundingClientRect();
                    const cr = canvas.getBoundingClientRect();
                    return {
                      left: (r.left - cr.left) / zoom,
                      top: (r.top - cr.top) / zoom,
                      width: r.width / zoom,
                      height: r.height / zoom
                    };
                  }
                  return { left: 0, top: 0, width: 0, height: 0 };
                })()
              }}
            />
          )}

          {/* Freeform pencil SVG overlay */}
          {activeAction === 'draw' && drawPoints.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-40">
              <path
                d={`M ${drawPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`}
                stroke={styleSettings.borderColor}
                strokeWidth={styleSettings.borderWidth || 3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={styleSettings.opacity}
              />
            </svg>
          )}

          {/* Temporary rectangle creation outline */}
          {activeAction === 'create' && tempCreateElement && (
            <div
              style={{
                position: 'absolute',
                left: tempCreateElement.x.base,
                top: tempCreateElement.y.base,
                width: tempCreateElement.width.base as number,
                height: tempCreateElement.height.base as number,
                pointerEvents: 'none',
                zIndex: 45
              }}
              className="border border-dashed border-indigo-500 bg-indigo-500/10 rounded"
            />
          )}

          {/* Concentric Box Model Overlay */}
          {boxModelActive && selectedId && (() => {
            const el = findElementById(elements, selectedId);
            return el ? <BoxModelOverlay element={el} viewport={viewportMode} /> : null;
          })()}

          {/* Active selection outline & resize anchors */}
          {selectRect && activeTool === 'select' && (
            <div
              style={{
                position: 'absolute',
                left: selectRect.x - 1,
                top: selectRect.y - 1,
                width: selectRect.w + 2,
                height: selectRect.h + 2,
                border: '1.5px solid #6366f1',
                pointerEvents: 'none',
                boxSizing: 'border-box',
                zIndex: 40
              }}
            >
              <div className="absolute inset-0 border border-indigo-400/20" />
              
              {/* Resizing handles */}
              {['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'].map((pos) => {
                let sStyle: React.CSSProperties = {};
                let cursor = 'default';

                switch (pos) {
                  case 'tl': sStyle = { top: -4, left: -4 }; cursor = 'nwse-resize'; break;
                  case 't': sStyle = { top: -4, left: 'calc(50% - 4px)' }; cursor = 'ns-resize'; break;
                  case 'tr': sStyle = { top: -4, right: -4 }; cursor = 'nesw-resize'; break;
                  case 'r': sStyle = { top: 'calc(50% - 4px)', right: -4 }; cursor = 'ew-resize'; break;
                  case 'br': sStyle = { bottom: -4, right: -4 }; cursor = 'nwse-resize'; break;
                  case 'b': sStyle = { bottom: -4, left: 'calc(50% - 4px)' }; cursor = 'ns-resize'; break;
                  case 'bl': sStyle = { bottom: -4, left: -4 }; cursor = 'nesw-resize'; break;
                  case 'l': sStyle = { top: 'calc(50% - 4px)', left: -4 }; cursor = 'ew-resize'; break;
                }

                return (
                  <div
                    key={pos}
                    data-handle={pos}
                    style={{
                      ...sStyle,
                      position: 'absolute',
                      width: 8,
                      height: 8,
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #6366f1',
                      borderRadius: '1px',
                      cursor,
                      pointerEvents: 'auto'
                    }}
                    className="shadow shadow-indigo-600/30 hover:scale-125 transition-transform"
                  />
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Floating coordinates indicator bottom right */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400 px-3 py-1.5 rounded-lg flex gap-3 shadow-xl backdrop-blur-md z-20">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="text-slate-700">|</span>
        <span>Viewport: {viewportMode.toUpperCase()}</span>
      </div>

    </div>
  );
};
