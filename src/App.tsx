import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { StyleControls } from './components/StyleControls';
import { Editor } from './components/Editor';
import { CanvasElement, ActiveTool, StyleSettings } from './types';
import { generateCode } from './utils/codeGenerator';
import { parseCode } from './utils/codeParser';

// Premium Initial Shapes Setup
const INITIAL_ELEMENTS: CanvasElement[] = [
  {
    id: 'rect-demo',
    type: 'rect',
    x: 80,
    y: 120,
    width: 160,
    height: 100,
    fill: '#3b82f6',
    borderWidth: 2,
    borderColor: '#1d4ed8',
    borderRadius: 8,
    opacity: 0.95
  },
  {
    id: 'circle-demo',
    type: 'circle',
    x: 290,
    y: 70,
    width: 120,
    height: 120,
    fill: '#ef4444',
    borderWidth: 0,
    borderColor: '#000000',
    opacity: 0.9
  },
  {
    id: 'triangle-demo',
    type: 'triangle',
    x: 270,
    y: 250,
    width: 140,
    height: 120,
    fill: '#10b981',
    borderWidth: 3,
    borderColor: '#047857',
    opacity: 0.85
  },
  {
    id: 'icon-demo',
    type: 'icon',
    x: 100,
    y: 280,
    width: 80,
    height: 80,
    fill: '#f59e0b',
    borderWidth: 2,
    borderColor: '#f59e0b',
    opacity: 1.0,
    iconName: 'Star'
  }
];

export const App: React.FC = () => {
  // Main Canvas State
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  
  // Layout Resizing State
  const [sidebarWidth, setSidebarWidth] = useState<number>(288); // w-72 = 288px
  const [styleControlsWidth, setStyleControlsWidth] = useState<number>(320); // w-80 = 320px
  const [editorWidth, setEditorWidth] = useState<number>(550); // initial editor width
  const [resizing, setResizing] = useState<'sidebar' | 'styleControls' | 'editor' | null>(null);

  // Editor Mode & Codes State
  const [editorMode, setEditorMode] = useState<'separate' | 'inline'>('separate');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [cssCode, setCssCode] = useState<string>('');
  const [inlineCode, setInlineCode] = useState<string>('');
  const [isValidCode, setIsValidCode] = useState<boolean>(true);
  
  // Active drawing & inserting styling state
  const [styleSettings, setStyleSettings] = useState<StyleSettings>({
    fill: '#3b82f6',
    borderWidth: 2,
    borderColor: '#1d4ed8',
    borderRadius: 8,
    opacity: 1.0
  });

  // Synchronization guard to avoid infinite recursive loop updates
  const isSyncingFromCodeRef = useRef(false);

  // Sync 1: Whenever canvas elements change, regenerate HTML/CSS code
  useEffect(() => {
    if (isSyncingFromCodeRef.current) return;
    const generated = generateCode(elements);
    setHtmlCode(generated.html);
    setCssCode(generated.css);
    setInlineCode(generated.inlineHtml);
    setIsValidCode(true);
  }, [elements]);

  // Layout resizing drag handler
  const startResize = (pane: 'sidebar' | 'styleControls' | 'editor') => (e: React.PointerEvent) => {
    e.preventDefault();
    setResizing(pane);
  };

  useEffect(() => {
    if (!resizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (resizing === 'sidebar') {
        const newWidth = Math.max(200, Math.min(450, e.clientX));
        setSidebarWidth(newWidth);
      } else if (resizing === 'styleControls') {
        const rightEdge = window.innerWidth - editorWidth;
        const newWidth = Math.max(200, Math.min(450, rightEdge - e.clientX));
        setStyleControlsWidth(newWidth);
      } else if (resizing === 'editor') {
        const newWidth = Math.max(300, Math.min(window.innerWidth - 600, window.innerWidth - e.clientX));
        setEditorWidth(newWidth);
      }
    };

    const handlePointerUp = () => {
      setResizing(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [resizing, editorWidth]);

  // Sync 2: Whenever selected element styles update, sync with default tools configuration
  const selectedElement = elements.find((el: CanvasElement) => el.id === selectedId) || null;
  useEffect(() => {
    if (selectedElement) {
      setStyleSettings({
        fill: selectedElement.fill,
        borderWidth: selectedElement.borderWidth,
        borderColor: selectedElement.borderColor,
        borderRadius: selectedElement.borderRadius ?? 0,
        opacity: selectedElement.opacity
      });
    }
  }, [selectedId]);

  // Handler: HTML Code changes in Editor
  const handleHtmlCodeChange = (newHtml: string) => {
    setHtmlCode(newHtml);

    if (newHtml.trim() === '') {
      isSyncingFromCodeRef.current = true;
      setElements([]);
      setSelectedId(null);
      setIsValidCode(true);
      setTimeout(() => {
        isSyncingFromCodeRef.current = false;
      }, 0);
      return;
    }

    const parsedElements = parseCode(newHtml, cssCode);
    const isValid = newHtml.includes('canvas-container') && parsedElements.length >= 0;
    setIsValidCode(isValid);

    if (isValid) {
      isSyncingFromCodeRef.current = true;
      setElements(parsedElements);
      
      if (selectedId && !parsedElements.some((el: CanvasElement) => el.id === selectedId)) {
        setSelectedId(null);
      }
      
      setTimeout(() => {
        isSyncingFromCodeRef.current = false;
      }, 0);
    }
  };

  // Handler: CSS Code changes in Editor
  const handleCssCodeChange = (newCss: string) => {
    setCssCode(newCss);

    const parsedElements = parseCode(htmlCode, newCss);
    const isValid = parsedElements.length >= 0;
    setIsValidCode(isValid);

    if (isValid) {
      isSyncingFromCodeRef.current = true;
      setElements(parsedElements);
      
      if (selectedId && !parsedElements.some((el: CanvasElement) => el.id === selectedId)) {
        setSelectedId(null);
      }
      
      setTimeout(() => {
        isSyncingFromCodeRef.current = false;
      }, 0);
    }
  };

  // Handler: Inline Code changes in Editor
  const handleInlineCodeChange = (newInline: string) => {
    setInlineCode(newInline);

    if (newInline.trim() === '') {
      isSyncingFromCodeRef.current = true;
      setElements([]);
      setSelectedId(null);
      setIsValidCode(true);
      setTimeout(() => {
        isSyncingFromCodeRef.current = false;
      }, 0);
      return;
    }

    const parsedElements = parseCode(newInline);
    const isValid = newInline.includes('canvas-container') && parsedElements.length >= 0;
    setIsValidCode(isValid);

    if (isValid) {
      isSyncingFromCodeRef.current = true;
      setElements(parsedElements);
      
      if (selectedId && !parsedElements.some((el: CanvasElement) => el.id === selectedId)) {
        setSelectedId(null);
      }
      
      setTimeout(() => {
        isSyncingFromCodeRef.current = false;
      }, 0);
    }
  };

  // Handler: Update canvas element properties
  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements((prev: CanvasElement[]) =>
      prev.map((el: CanvasElement) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  // Handler: Create new element on canvas
  const handleAddElement = (newElement: CanvasElement) => {
    setElements((prev: CanvasElement[]) => [...prev, newElement]);
  };

  // Handler: Delete selected element
  const handleDeleteElement = (id: string) => {
    setElements((prev: CanvasElement[]) => prev.filter((el: CanvasElement) => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  // Handler: Add Lucide Icon to Canvas Center
  const handleAddIcon = (iconName: string) => {
    const newIconElement: CanvasElement = {
      id: `icon-${Date.now()}`,
      type: 'icon',
      x: 180,
      y: 180,
      width: 64,
      height: 64,
      fill: styleSettings.fill,
      borderWidth: 2,
      borderColor: styleSettings.borderColor,
      opacity: styleSettings.opacity,
      iconName
    };
    handleAddElement(newIconElement);
    setSelectedId(newIconElement.id);
    setActiveTool('select');
  };

  // Handler: Layers adjustments
  const handleBringToFront = (id: string) => {
    setElements((prev: CanvasElement[]) => {
      const index = prev.findIndex((el: CanvasElement) => el.id === id);
      if (index === -1) return prev;
      const filtered = prev.filter((el: CanvasElement) => el.id !== id);
      return [...filtered, prev[index]];
    });
  };

  const handleSendToBack = (id: string) => {
    setElements((prev: CanvasElement[]) => {
      const index = prev.findIndex((el: CanvasElement) => el.id === id);
      if (index === -1) return prev;
      const filtered = prev.filter((el: CanvasElement) => el.id !== id);
      return [prev[index], ...filtered];
    });
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Left Sidebar: Selection & Shape Creation */}
      <div style={{ width: sidebarWidth }} className="h-full shrink-0 flex">
        <div className="flex-1 min-w-0">
          <Sidebar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onAddIcon={handleAddIcon}
          />
        </div>
        {/* Vertical Resizer between Sidebar & Canvas */}
        <div
          onPointerDown={startResize('sidebar')}
          className={`w-[4px] hover:w-[6px] active:w-[6px] bg-slate-800 hover:bg-indigo-500 active:bg-indigo-500 cursor-col-resize transition-all h-full shrink-0 select-none z-30 flex items-center justify-center`}
        >
          <div className="h-8 w-[2px] bg-slate-700/50 rounded-full"></div>
        </div>
      </div>

      {/* 2. Visual Canvas Core (Left/Center region) */}
      <div className="flex-1 h-full min-w-0">
        <Canvas
          elements={elements}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          styleSettings={styleSettings}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onDeleteElement={handleDeleteElement}
        />
      </div>

      {/* 3. Style Controls Panel (Right inspector) */}
      <div style={{ width: styleControlsWidth }} className="h-full shrink-0 flex">
        {/* Vertical Resizer between Canvas & StyleControls */}
        <div
          onPointerDown={startResize('styleControls')}
          className={`w-[4px] hover:w-[6px] active:w-[6px] bg-slate-800 hover:bg-indigo-500 active:bg-indigo-500 cursor-col-resize transition-all h-full shrink-0 select-none z-30 flex items-center justify-center`}
        >
          <div className="h-8 w-[2px] bg-slate-700/50 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <StyleControls
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
          />
        </div>
      </div>

      {/* 4. Right Sidebar: Live Monaco Editor */}
      <div style={{ width: editorWidth }} className="h-full shrink-0 flex">
        {/* Vertical Resizer between StyleControls & Editor */}
        <div
          onPointerDown={startResize('editor')}
          className={`w-[4px] hover:w-[6px] active:w-[6px] bg-slate-800 hover:bg-indigo-500 active:bg-indigo-500 cursor-col-resize transition-all h-full shrink-0 select-none z-30 flex items-center justify-center`}
        >
          <div className="h-8 w-[2px] bg-slate-700/50 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <Editor
            htmlCode={htmlCode}
            onHtmlCodeChange={handleHtmlCodeChange}
            cssCode={cssCode}
            onCssCodeChange={handleCssCodeChange}
            inlineCode={inlineCode}
            onInlineCodeChange={handleInlineCodeChange}
            isValid={isValidCode}
            editorMode={editorMode}
            setEditorMode={setEditorMode}
          />
        </div>
      </div>
    </div>
  );
};
export default App;
