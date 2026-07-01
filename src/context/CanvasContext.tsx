import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  CanvasElement, 
  ActiveTool, 
  ViewportMode, 
  StyleSettings, 
  GeneratedCode 
} from '../types';
import { generateCode } from '../utils/codeGenerator';
import { parseCode } from '../utils/codeParser';

interface CanvasContextType {
  elements: CanvasElement[];
  selectedId: string | null;
  activeTool: ActiveTool;
  viewportMode: ViewportMode;
  pan: { x: number; y: number };
  zoom: number;
  boxModelActive: boolean;
  styleSettings: StyleSettings;
  editorMode: 'separate' | 'inline' | 'tailwind';
  htmlCode: string;
  cssCode: string;
  inlineCode: string;
  tailwindCode: string;
  isValidCode: boolean;
  showEditor: boolean;
  showSidebar: boolean;
  
  // History Slider / Time Travel
  history: CanvasElement[][];
  historyIndex: number;
  
  // State Mutators
  setSelectedId: (id: string | null) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setViewportMode: (mode: ViewportMode) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setBoxModelActive: (active: boolean) => void;
  setStyleSettings: (settings: StyleSettings | ((prev: StyleSettings) => StyleSettings)) => void;
  setEditorMode: (mode: 'separate' | 'inline' | 'tailwind') => void;
  setShowEditor: (show: boolean) => void;
  setShowSidebar: (show: boolean) => void;
  editPathNodes: boolean;
  setEditPathNodes: (val: boolean) => void;
  
  // Operations
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  addElement: (element: CanvasElement, parentId?: string | null) => void;
  deleteElement: (id: string) => void;
  nestElement: (elementId: string, targetParentId: string | null, absoluteX: number, absoluteY: number, canvasNode: HTMLElement | null) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  
  // History control
  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
  
  // Code Editor sync handlers
  syncFromHtml: (html: string) => void;
  syncFromCss: (css: string) => void;
  syncFromInline: (inline: string) => void;
  syncFromTailwind: (tailwind: string) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

const INITIAL_STYLE_SETTINGS: StyleSettings = {
  fill: '#3b82f6',
  borderWidth: 0,
  borderColor: '#1d4ed8',
  borderRadius: 8,
  opacity: 1.0,
};

const INITIAL_ELEMENTS: CanvasElement[] = [];

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [boxModelActive, setBoxModelActive] = useState(false);
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(INITIAL_STYLE_SETTINGS);
  const [editorMode, setEditorMode] = useState<'separate' | 'inline' | 'tailwind'>('separate');
  
  // Monaco Synced Codes
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [inlineCode, setInlineCode] = useState('');
  const [tailwindCode, setTailwindCode] = useState('');
  const [isValidCode, setIsValidCode] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editPathNodes, setEditPathNodes] = useState(false);

  useEffect(() => {
    setEditPathNodes(false);
  }, [selectedId]);

  // Time Travel State History
  const [history, setHistory] = useState<CanvasElement[][]>([INITIAL_ELEMENTS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Guard to prevent circular rendering loop updates
  const isSyncingFromCode = useRef(false);

  // Push updates to history
  const pushState = (newElements: CanvasElement[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, newElements]);
    setHistoryIndex(updatedHistory.length);
    setElements(newElements);
  };

  // Sync 1: Update code editor outputs whenever canvas layout structures change
  useEffect(() => {
    if (isSyncingFromCode.current) return;
    
    const compiled: GeneratedCode = generateCode(elements);
    setHtmlCode(compiled.html);
    setCssCode(compiled.css);
    setInlineCode(compiled.inlineHtml);
    setTailwindCode(compiled.tailwindHtml);
    setIsValidCode(true);
  }, [elements]);

  // Synchronize current Inspector defaults when an element is clicked
  useEffect(() => {
    if (selectedId) {
      const found = findElementById(elements, selectedId);
      if (found) {
        setStyleSettings({
          fill: found.styles.fill,
          borderWidth: found.styles.borderWidth,
          borderColor: found.styles.borderColor,
          borderRadius: found.styles.borderRadius ?? 0,
          opacity: found.styles.opacity,
        });
      }
    }
  }, [selectedId, elements]);

  // Recursive Tree Find Helper
  const findElementById = (tree: CanvasElement[], id: string): CanvasElement | null => {
    for (const el of tree) {
      if (el.id === id) return el;
      if (el.children) {
        const nested = findElementById(el.children, id);
        if (nested) return nested;
      }
    }
    return null;
  };

  // Update Element properties in the JSON Tree
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const applyUpdates = (node: CanvasElement): CanvasElement => {
      if (node.id === id) {
        // Deep merge style properties if they are updated
        const styleMerged = updates.styles 
          ? { ...node.styles, ...updates.styles } 
          : node.styles;
          
        return {
          ...node,
          ...updates,
          styles: styleMerged,
        };
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(applyUpdates),
        };
      }
      
      return node;
    };
    
    const newElements = elements.map(applyUpdates);
    pushState(newElements);
  };

  // Add Element to Tree
  const addElement = (newElement: CanvasElement, parentId: string | null = null) => {
    if (!parentId) {
      pushState([...elements, newElement]);
      return;
    }

    const appendChild = (node: CanvasElement): CanvasElement => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newElement]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(appendChild)
        };
      }
      return node;
    };

    pushState(elements.map(appendChild));
  };

  // Delete Element from Tree
  const deleteElement = (id: string) => {
    const filterNode = (node: CanvasElement): boolean => node.id !== id;
    
    const cleanChildren = (node: CanvasElement): CanvasElement => {
      if (node.children) {
        return {
          ...node,
          children: node.children.filter(filterNode).map(cleanChildren)
        };
      }
      return node;
    };

    const newElements = elements.filter(filterNode).map(cleanChildren);
    pushState(newElements);
    if (selectedId === id) setSelectedId(null);
  };

  // Handle Visual Nesting & Drops
  const nestElement = (
    elementId: string,
    targetParentId: string | null,
    absoluteX: number,
    absoluteY: number,
    canvasNode: HTMLElement | null
  ) => {
    const targetElement = findElementById(elements, elementId);
    if (!targetElement) return;

    // Helper to calculate target coordinate changes
    let newX = targetElement.x;
    let newY = targetElement.y;

    if (targetParentId) {
      const parentDom = document.getElementById(targetParentId);
      const canvasDom = canvasNode;
      if (parentDom && canvasDom) {
        const parentRect = parentDom.getBoundingClientRect();
        const canvasRect = canvasDom.getBoundingClientRect();
        
        // Project absolute coordinate relative to parent viewport offset
        const localX = Math.round((absoluteX - (parentRect.left - canvasRect.left) / zoom));
        const localY = Math.round((absoluteY - (parentRect.top - canvasRect.top) / zoom));
        
        newX = {
          base: viewportMode === 'mobile' ? localX : (targetElement.x.base),
          md: viewportMode === 'tablet' ? localX : (targetElement.x.md ?? targetElement.x.base),
          lg: viewportMode === 'desktop' ? localX : (targetElement.x.lg ?? targetElement.x.base),
        };

        newY = {
          base: viewportMode === 'mobile' ? localY : (targetElement.y.base),
          md: viewportMode === 'tablet' ? localY : (targetElement.y.md ?? targetElement.y.base),
          lg: viewportMode === 'desktop' ? localY : (targetElement.y.lg ?? targetElement.y.base),
        };
      }
    } else {
      // Reverting to root absolute
      newX = {
        base: viewportMode === 'mobile' ? absoluteX : (targetElement.x.base),
        md: viewportMode === 'tablet' ? absoluteX : (targetElement.x.md ?? targetElement.x.base),
        lg: viewportMode === 'desktop' ? absoluteX : (targetElement.x.lg ?? targetElement.x.base),
      };
      newY = {
        base: viewportMode === 'mobile' ? absoluteY : (targetElement.y.base),
        md: viewportMode === 'tablet' ? absoluteY : (targetElement.y.md ?? targetElement.y.base),
        lg: viewportMode === 'desktop' ? absoluteY : (targetElement.y.lg ?? targetElement.y.base),
      };
    }

    // Clone element with updated geometry coordinates
    const updatedElement: CanvasElement = {
      ...targetElement,
      x: newX,
      y: newY,
    };

    // Remove old copy of element from tree
    const removeNode = (list: CanvasElement[]): CanvasElement[] => {
      return list
        .filter((el) => el.id !== elementId)
        .map((el) => ({
          ...el,
          children: el.children ? removeNode(el.children) : [],
        }));
    };

    let treeWithoutEl = removeNode(elements);

    // Insert into target parent
    if (targetParentId) {
      const insertNode = (list: CanvasElement[]): CanvasElement[] => {
        return list.map((el) => {
          if (el.id === targetParentId) {
            return {
              ...el,
              children: [...(el.children || []), updatedElement],
            };
          }
          return {
            ...el,
            children: el.children ? insertNode(el.children) : [],
          };
        });
      };
      treeWithoutEl = insertNode(treeWithoutEl);
    } else {
      treeWithoutEl.push(updatedElement);
    }

    pushState(treeWithoutEl);
  };

  // Reorder Elements: Bring to Front
  const bringToFront = (id: string) => {
    const processLevel = (list: CanvasElement[]): CanvasElement[] => {
      const idx = list.findIndex((el) => el.id === id);
      if (idx !== -1) {
        const item = list[idx];
        const rest = list.filter((el) => el.id !== id);
        return [...rest, item];
      }
      return list.map((el) => ({
        ...el,
        children: el.children ? processLevel(el.children) : [],
      }));
    };
    pushState(processLevel(elements));
  };

  // Reorder Elements: Send to Back
  const sendToBack = (id: string) => {
    const processLevel = (list: CanvasElement[]): CanvasElement[] => {
      const idx = list.findIndex((el) => el.id === id);
      if (idx !== -1) {
        const item = list[idx];
        const rest = list.filter((el) => el.id !== id);
        return [item, ...rest];
      }
      return list.map((el) => ({
        ...el,
        children: el.children ? processLevel(el.children) : [],
      }));
    };
    pushState(processLevel(elements));
  };

  // Undo & Redo Controls
  const undo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      isSyncingFromCode.current = true;
      setElements(history[idx]);
      setTimeout(() => {
        isSyncingFromCode.current = false;
      }, 0);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      isSyncingFromCode.current = true;
      setElements(history[idx]);
      setTimeout(() => {
        isSyncingFromCode.current = false;
      }, 0);
    }
  };

  const jumpToHistory = (idx: number) => {
    if (idx >= 0 && idx < history.length) {
      setHistoryIndex(idx);
      isSyncingFromCode.current = true;
      setElements(history[idx]);
      setTimeout(() => {
        isSyncingFromCode.current = false;
      }, 0);
    }
  };

  // Bidirectional Synchronization Handler: HTML Code changed in Editor
  const syncFromHtml = (code: string) => {
    setHtmlCode(code);
    if (code.trim() === '') {
      isSyncingFromCode.current = true;
      setElements([]);
      setSelectedId(null);
      setIsValidCode(true);
      setTimeout(() => {
        isSyncingFromCode.current = false;
      }, 0);
      return;
    }

    try {
      const parsed = parseCode(code, cssCode);
      if (parsed) {
        isSyncingFromCode.current = true;
        setElements(parsed);
        setIsValidCode(true);
        setTimeout(() => {
          isSyncingFromCode.current = false;
        }, 0);
      } else {
        setIsValidCode(false);
      }
    } catch (e) {
      setIsValidCode(false);
    }
  };

  // Bidirectional Synchronization Handler: CSS Code changed in Editor
  const syncFromCss = (code: string) => {
    setCssCode(code);
    try {
      const parsed = parseCode(htmlCode, code);
      if (parsed) {
        isSyncingFromCode.current = true;
        setElements(parsed);
        setIsValidCode(true);
        setTimeout(() => {
          isSyncingFromCode.current = false;
        }, 0);
      } else {
        setIsValidCode(false);
      }
    } catch (e) {
      setIsValidCode(false);
    }
  };

  // Bidirectional Synchronization Handler: Inline Code changed in Editor
  const syncFromInline = (code: string) => {
    setInlineCode(code);
    if (code.trim() === '') {
      isSyncingFromCode.current = true;
      setElements([]);
      setSelectedId(null);
      setIsValidCode(true);
      setTimeout(() => {
        isSyncingFromCode.current = false;
      }, 0);
      return;
    }

    try {
      const parsed = parseCode(code);
      if (parsed) {
        isSyncingFromCode.current = true;
        setElements(parsed);
        setIsValidCode(true);
        setTimeout(() => {
          isSyncingFromCode.current = false;
        }, 0);
      } else {
        setIsValidCode(false);
      }
    } catch (e) {
      setIsValidCode(false);
    }
  };

  // Bidirectional Synchronization Handler: Tailwind HTML changed in Editor
  const syncFromTailwind = (code: string) => {
    setTailwindCode(code);
    if (code.trim() === '') {
      isSyncingFromCode.current = true;
      setElements([]);
      setSelectedId(null);
      setIsValidCode(true);
      setTimeout(() => {
        isSyncingFromCode.current = false;
      }, 0);
      return;
    }

    try {
      const parsed = parseCode(code);
      if (parsed) {
        isSyncingFromCode.current = true;
        setElements(parsed);
        setIsValidCode(true);
        setTimeout(() => {
          isSyncingFromCode.current = false;
        }, 0);
      } else {
        setIsValidCode(false);
      }
    } catch (e) {
      setIsValidCode(false);
    }
  };

  return (
    <CanvasContext.Provider
      value={{
        elements,
        selectedId,
        activeTool,
        viewportMode,
        pan,
        zoom,
        boxModelActive,
        styleSettings,
        editorMode,
        htmlCode,
        cssCode,
        inlineCode,
        tailwindCode,
        isValidCode,
        showEditor,
        showSidebar,
        history,
        historyIndex,
        editPathNodes,
        setEditPathNodes,
        
        setSelectedId,
        setActiveTool,
        setViewportMode,
        setPan,
        setZoom,
        setBoxModelActive,
        setStyleSettings,
        setEditorMode,
        setShowEditor,
        setShowSidebar,
        
        updateElement,
        addElement,
        deleteElement,
        nestElement,
        bringToFront,
        sendToBack,
        
        undo,
        redo,
        jumpToHistory,
        
        syncFromHtml,
        syncFromCss,
        syncFromInline,
        syncFromTailwind,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) throw new Error('useCanvas must be used within CanvasProvider');
  return context;
};
