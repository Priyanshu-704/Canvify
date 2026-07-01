import React, { useState, useEffect } from 'react';
import { useCanvas } from './context/CanvasContext';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { SimulatorBar } from './components/SimulatorBar';
import { StyleControls } from './components/StyleControls';
import { Editor } from './components/Editor';

export const App: React.FC = () => {
  const { showEditor, showSidebar } = useCanvas();

  // Pane Layout resizing states
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);       // w-60 = 240px
  const [styleControlsWidth, setStyleControlsWidth] = useState<number>(300); // 300px
  const [editorWidth, setEditorWidth] = useState<number>(550);         // 550px
  const [resizing, setResizing] = useState<'sidebar' | 'styleControls' | 'editor' | null>(null);

  const startResize = (pane: 'sidebar' | 'styleControls' | 'editor') => (e: React.PointerEvent) => {
    e.preventDefault();
    setResizing(pane);
  };

  useEffect(() => {
    if (!resizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (resizing === 'sidebar') {
        const newWidth = Math.max(180, Math.min(350, e.clientX));
        setSidebarWidth(newWidth);
      } else if (resizing === 'styleControls') {
        const rightEdge = window.innerWidth - (showEditor ? editorWidth : 0);
        const newWidth = Math.max(220, Math.min(400, rightEdge - e.clientX));
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
  }, [resizing, editorWidth, showEditor]);

  return (
    <div className="w-screen h-screen flex bg-slate-950 overflow-hidden text-slate-100 font-sans antialiased select-none">
      
      {/* 1. Left Sidebar Tools */}
      {showSidebar && (
        <>
          <div style={{ width: sidebarWidth }} className="h-full shrink-0 flex flex-col">
            <Sidebar />
          </div>

          {/* Sidebar resize handler */}
          <div
            onPointerDown={startResize('sidebar')}
            className="w-1 hover:w-1.5 active:w-1.5 bg-slate-800/80 hover:bg-indigo-500 active:bg-indigo-500 cursor-col-resize transition-all shrink-0 z-20"
          />
        </>
      )}

      {/* 2. Center/Main Design Workspace Area */}
      <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-950">
        <SimulatorBar />
        <Canvas />
      </div>

      {/* Style Controls resize handler */}
      <div
        onPointerDown={startResize('styleControls')}
        className="w-1 hover:w-1.5 active:w-1.5 bg-slate-800/80 hover:bg-indigo-500 active:bg-indigo-500 cursor-col-resize transition-all shrink-0 z-20"
      />

      {/* 3. Style Controls (Inspector Pane) */}
      <div style={{ width: styleControlsWidth }} className="h-full shrink-0 flex flex-col bg-slate-900 border-l border-slate-800">
        <StyleControls />
      </div>

      {/* 4. Monaco Editor Panel - Conditionally Rendered */}
      {showEditor && (
        <>
          {/* Editor resize handler */}
          <div
            onPointerDown={startResize('editor')}
            className="w-1 hover:w-1.5 active:w-1.5 bg-slate-800/80 hover:bg-indigo-500 active:bg-indigo-500 cursor-col-resize transition-all shrink-0 z-20"
          />

          {/* Monaco Editor Pane */}
          <div style={{ width: editorWidth }} className="h-full shrink-0 flex flex-col bg-slate-900 border-l border-slate-800">
            <Editor />
          </div>
        </>
      )}

    </div>
  );
};

export default App;
