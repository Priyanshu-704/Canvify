import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Copy, Check, FileCode, AlertCircle, Sparkles } from 'lucide-react';

interface EditorProps {
  htmlCode: string;
  onHtmlCodeChange: (newCode: string) => void;
  cssCode: string;
  onCssCodeChange: (newCode: string) => void;
  inlineCode: string;
  onInlineCodeChange: (newCode: string) => void;
  isValid: boolean;
  editorMode: 'separate' | 'inline';
  setEditorMode: (mode: 'separate' | 'inline') => void;
}

export const Editor: React.FC<EditorProps> = ({ 
  htmlCode, 
  onHtmlCodeChange,
  cssCode,
  onCssCodeChange,
  inlineCode,
  onInlineCodeChange,
  isValid,
  editorMode,
  setEditorMode
}) => {
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedInline, setCopiedInline] = useState(false);

  // Vertical resize states
  const [htmlHeightPercent, setHtmlHeightPercent] = useState<number>(50); // 50%
  const [resizingVertical, setResizingVertical] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startVerticalResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setResizingVertical(true);
  };

  useEffect(() => {
    if (!resizingVertical) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      // Header is h-14 = 56px
      const headerHeight = 56;
      const contentHeight = rect.height - headerHeight;
      const contentY = relativeY - headerHeight;
      const newPercent = Math.max(15, Math.min(85, (contentY / contentHeight) * 100));
      setHtmlHeightPercent(newPercent);
    };

    const handlePointerUp = () => {
      setResizingVertical(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [resizingVertical]);

  // Handle Copy to Clipboard
  const handleCopy = async (text: string, type: 'html' | 'css' | 'inline') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'html') {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      } else if (type === 'css') {
        setCopiedCss(true);
        setTimeout(() => setCopiedCss(false), 2000);
      } else {
        setCopiedInline(true);
        setTimeout(() => setCopiedInline(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 12,
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
    lineNumbers: 'on' as const,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    wordWrap: 'on' as const,
    padding: { top: 12, bottom: 12 },
    formatOnPaste: true,
    formatOnType: true,
    automaticLayout: true,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    renderLineHighlight: 'all' as const,
    tabSize: 2,
    insertSpaces: true,
  };

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col bg-[#1a1b26] border-l border-slate-800 relative select-none"
    >
      {/* Editor Header Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0 z-10">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">Code Editors</span>
          
          {/* Synced / Error State Badge */}
          {isValid ? (
            <span className="flex items-center gap-1 text-[9px] bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 px-2 py-0.5 rounded-full font-medium ml-1.5 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] bg-red-950/60 border border-red-800/80 text-red-400 px-2 py-0.5 rounded-full font-medium ml-1.5 animate-fadeIn">
              <AlertCircle className="w-2.5 h-2.5" />
              Syntax Error
            </span>
          )}
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setEditorMode('separate')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
              editorMode === 'separate'
                ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HTML + CSS
          </button>
          <button
            onClick={() => setEditorMode('inline')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
              editorMode === 'inline'
                ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inline HTML
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {editorMode === 'separate' ? (
          <>
            {/* HTML Editor Section */}
            <div 
              style={{ height: `calc(${htmlHeightPercent}% - 2px)` }}
              className="flex flex-col min-h-[60px]"
            >
              {/* Sub-Header */}
              <div className="h-8 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">HTML Output</span>
                <button
                  onClick={() => handleCopy(htmlCode, 'html')}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy HTML</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Monaco Container */}
              <div className="flex-1 min-h-0 relative">
                <MonacoEditor
                  height="100%"
                  language="html"
                  theme="vs-dark"
                  value={htmlCode}
                  onChange={(val) => {
                    if (val !== undefined) onHtmlCodeChange(val);
                  }}
                  options={editorOptions}
                />
              </div>
            </div>

            {/* Vertical Resize Handle */}
            <div
              onPointerDown={startVerticalResize}
              className="h-1 hover:h-1.5 active:h-1.5 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-500 cursor-row-resize transition-all shrink-0 select-none z-20 flex items-center justify-center"
            >
              <div className="w-8 h-[2px] bg-slate-700/50 rounded-full"></div>
            </div>

            {/* CSS Editor Section */}
            <div 
              style={{ height: `calc(${100 - htmlHeightPercent}% - 2px)` }}
              className="flex flex-col min-h-[60px]"
            >
              {/* Sub-Header */}
              <div className="h-8 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CSS Stylesheet</span>
                <button
                  onClick={() => handleCopy(cssCode, 'css')}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  {copiedCss ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy CSS</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Monaco Container */}
              <div className="flex-1 min-h-0 relative">
                <MonacoEditor
                  height="100%"
                  language="css"
                  theme="vs-dark"
                  value={cssCode}
                  onChange={(val) => {
                    if (val !== undefined) onCssCodeChange(val);
                  }}
                  options={editorOptions}
                />
              </div>
            </div>
          </>
        ) : (
          /* Inline HTML Editor Mode (Single Editor) */
          <div className="flex flex-col h-full">
            <div className="h-8 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                Inline HTML Output
              </span>
              <button
                onClick={() => handleCopy(inlineCode, 'inline')}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                {copiedInline ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Inline HTML</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Monaco Container */}
            <div className="flex-1 min-h-0 relative">
              <MonacoEditor
                height="100%"
                language="html"
                theme="vs-dark"
                value={inlineCode}
                onChange={(val) => {
                  if (val !== undefined) onInlineCodeChange(val);
                }}
                options={editorOptions}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
