import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Copy, Check, FileCode, AlertCircle, Sparkles, Code2, Menu } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';

export const Editor: React.FC = () => {
  const {
    htmlCode,
    cssCode,
    inlineCode,
    tailwindCode,
    isValidCode,
    editorMode,
    setEditorMode,
    syncFromHtml,
    syncFromCss,
    syncFromInline,
    syncFromTailwind
  } = useCanvas();

  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedInline, setCopiedInline] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);

  // Responsive Layout detection for Editor options
  const [isNarrow, setIsNarrow] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Vertical resize states for separate mode
  const [htmlHeightPercent, setHtmlHeightPercent] = useState<number>(50); // 50%
  const [resizingVertical, setResizingVertical] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setIsNarrow(entry.contentRect.width < 450);
      }
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

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
      const headerHeight = 56; // h-14
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

  const handleCopy = async (text: string, type: 'html' | 'css' | 'inline' | 'tailwind') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'html') {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      } else if (type === 'css') {
        setCopiedCss(true);
        setTimeout(() => setCopiedCss(false), 2000);
      } else if (type === 'inline') {
        setCopiedInline(true);
        setTimeout(() => setCopiedInline(false), 2000);
      } else {
        setCopiedTailwind(true);
        setTimeout(() => setCopiedTailwind(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy code text:', err);
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
    // Emmet abbreviation trigger options
    suggest: {
      showMethods: true,
      showFunctions: true,
      showConstructor: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showKeywords: true,
      showWords: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showSnippets: true,
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-[#0f172a] border-l border-slate-800 relative select-none"
    >
      {/* Editor Main Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 shrink-0 z-10 gap-2 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
          {!isNarrow && (
            <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase truncate">Workspace Editor</span>
          )}

          {isValidCode ? (
            <span className="flex items-center gap-1 text-[9px] bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-0.5 sm:ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isNarrow ? "Synced" : "Live Synced"}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] bg-red-950/60 border border-red-800/80 text-red-400 px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-0.5 sm:ml-1">
              <AlertCircle className="w-2.5 h-2.5" />
              {isNarrow ? "Error" : "Syntax Warning"}
            </span>
          )}
        </div>

        {/* Options Selector: Tab switcher or Hamburger Dropdown */}
        {isNarrow ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all flex items-center gap-1.5"
              title="Editor Options"
            >
              <Menu className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {editorMode === 'separate' ? 'HTML+CSS' : editorMode === 'tailwind' ? 'Tailwind' : 'Inline'}
              </span>
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 animate-fadeIn">
                  <button
                    onClick={() => {
                      setEditorMode('separate');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-medium transition-all ${
                      editorMode === 'separate'
                        ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    HTML + CSS
                  </button>
                  <button
                    onClick={() => {
                      setEditorMode('tailwind');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-medium transition-all ${
                      editorMode === 'tailwind'
                        ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    Tailwind CSS
                  </button>
                  <button
                    onClick={() => {
                      setEditorMode('inline');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-medium transition-all ${
                      editorMode === 'inline'
                        ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    Inline HTML
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80 shrink-0">
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
              onClick={() => setEditorMode('tailwind')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                editorMode === 'tailwind'
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tailwind CSS
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
        )}
      </div>

      {/* Editor Areas depending on Mode */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {editorMode === 'separate' && (
          <>
            {/* HTML separate */}
            <div
              style={{ height: `calc(${htmlHeightPercent}% - 2px)` }}
              className="flex flex-col min-h-[60px]"
            >
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

              <div className="flex-1 min-h-0 relative">
                <MonacoEditor
                  height="100%"
                  language="html"
                  theme="vs-dark"
                  value={htmlCode}
                  onChange={(val) => {
                    if (val !== undefined) syncFromHtml(val);
                  }}
                  options={editorOptions}
                />
              </div>
            </div>

            {/* Resize Slider Divider */}
            <div
              onPointerDown={startVerticalResize}
              className="h-1 hover:h-1.5 active:h-1.5 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-500 cursor-row-resize transition-all shrink-0 select-none z-20 flex items-center justify-center"
            >
              <div className="w-8 h-[2px] bg-slate-700/50 rounded-full" />
            </div>

            {/* CSS separate */}
            <div
              style={{ height: `calc(${100 - htmlHeightPercent}% - 2px)` }}
              className="flex flex-col min-h-[60px]"
            >
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

              <div className="flex-1 min-h-0 relative">
                <MonacoEditor
                  height="100%"
                  language="css"
                  theme="vs-dark"
                  value={cssCode}
                  onChange={(val) => {
                    if (val !== undefined) syncFromCss(val);
                  }}
                  options={editorOptions}
                />
              </div>
            </div>
          </>
        )}

        {/* Tailwind HTML Code Editor */}
        {editorMode === 'tailwind' && (
          <div className="flex flex-col h-full">
            <div className="h-8 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Tailwind CSS Markup
              </span>
              <button
                onClick={() => handleCopy(tailwindCode, 'tailwind')}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                {copiedTailwind ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Tailwind HTML</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 min-h-0 relative">
              <MonacoEditor
                height="100%"
                language="html"
                theme="vs-dark"
                value={tailwindCode}
                onChange={(val) => {
                  if (val !== undefined) syncFromTailwind(val);
                }}
                options={editorOptions}
              />
            </div>
          </div>
        )}

        {/* Inline CSS HTML Editor */}
        {editorMode === 'inline' && (
          <div className="flex flex-col h-full">
            <div className="h-8 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between px-4 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                Inline Styles HTML
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

            <div className="flex-1 min-h-0 relative">
              <MonacoEditor
                height="100%"
                language="html"
                theme="vs-dark"
                value={inlineCode}
                onChange={(val) => {
                  if (val !== undefined) syncFromInline(val);
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
