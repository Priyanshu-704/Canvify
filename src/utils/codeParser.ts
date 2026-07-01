import { CanvasElement, BoxModel, ElementStyles, ResponsiveValue } from '../types';

function normalizeColor(color: string): string {
  if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') return 'transparent';
  if (color.startsWith('#')) return color;
  
  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  
  const named: Record<string, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#10b981', yellow: '#f59e0b',
    black: '#000000', white: '#ffffff', gray: '#6b7280', transparent: 'transparent'
  };
  return named[color.toLowerCase()] || color;
}

// Parse tailwind style dimensions like md:w-[200px] or left-[50px]
function parseTailwindClass(
  className: string, 
  x: ResponsiveValue<number>,
  y: ResponsiveValue<number>,
  w: ResponsiveValue<number | string>,
  h: ResponsiveValue<number | string>,
  pos: ResponsiveValue<'absolute' | 'relative'>,
  styles: ElementStyles
) {
  const parts = className.split(':');
  const prefix = parts.length > 1 ? parts[0] : 'base';
  const utility = parts.length > 1 ? parts[1] : parts[0];

  // Helper to set responsive fields
  const setResponsive = <T>(obj: ResponsiveValue<T>, val: T) => {
    if (prefix === 'lg') obj.lg = val;
    else if (prefix === 'md') obj.md = val;
    else obj.base = val;
  };

  // 1. Width matching
  let match = utility.match(/^w-\[(\d+)px\]$/);
  if (match) {
    setResponsive(w, parseInt(match[1]));
  } else if (utility === 'w-full') {
    setResponsive(w, 'full');
  } else if (utility === 'w-auto') {
    setResponsive(w, 'auto');
  }

  // 2. Height matching
  match = utility.match(/^h-\[(\d+)px\]$/);
  if (match) {
    setResponsive(h, parseInt(match[1]));
  } else if (utility === 'h-full') {
    setResponsive(h, 'full');
  } else if (utility === 'h-auto') {
    setResponsive(h, 'auto');
  }

  // 3. Absolute offsets
  match = utility.match(/^left-\[(\d+)px\]$/);
  if (match) {
    setResponsive(x, parseInt(match[1]));
  }
  match = utility.match(/^top-\[(\d+)px\]$/);
  if (match) {
    setResponsive(y, parseInt(match[1]));
  }

  // 4. Position
  if (utility === 'absolute') setResponsive(pos, 'absolute');
  if (utility === 'relative') setResponsive(pos, 'relative');

  // 5. Stylings
  match = utility.match(/^bg-\[(\#[a-fA-F0-9]{3,8})\]$/);
  if (match) styles.fill = match[1];

  match = utility.match(/^border-\[(\d+)px\]$/);
  if (match) styles.borderWidth = parseInt(match[1]);

  match = utility.match(/^border-\[(\#[a-fA-F0-9]{3,8})\]$/);
  if (match) styles.borderColor = match[1];

  match = utility.match(/^rounded-\[(\d+)px\]$/);
  if (match) styles.borderRadius = parseInt(match[1]);

  match = utility.match(/^opacity-\[([\d\.]+)\]$/);
  if (match) styles.opacity = parseFloat(match[1]);

  // Paddings
  match = utility.match(/^p-\[(\d+)px\]$/);
  if (match) {
    const val = parseInt(match[1]);
    styles.padding = { top: val, right: val, bottom: val, left: val };
  }
  match = utility.match(/^pt-\[(\d+)px\]$/);
  if (match) styles.padding.top = parseInt(match[1]);
  match = utility.match(/^pr-\[(\d+)px\]$/);
  if (match) styles.padding.right = parseInt(match[1]);
  match = utility.match(/^pb-\[(\d+)px\]$/);
  if (match) styles.padding.bottom = parseInt(match[1]);
  match = utility.match(/^pl-\[(\d+)px\]$/);
  if (match) styles.padding.left = parseInt(match[1]);

  // Margins
  match = utility.match(/^m-\[(\d+)px\]$/);
  if (match) {
    const val = parseInt(match[1]);
    styles.margin = { top: val, right: val, bottom: val, left: val };
  }
  match = utility.match(/^mt-\[(\d+)px\]$/);
  if (match) styles.margin.top = parseInt(match[1]);
  match = utility.match(/^mr-\[(\d+)px\]$/);
  if (match) styles.margin.right = parseInt(match[1]);
  match = utility.match(/^mb-\[(\d+)px\]$/);
  if (match) styles.margin.bottom = parseInt(match[1]);
  match = utility.match(/^ml-\[(\d+)px\]$/);
  if (match) styles.margin.left = parseInt(match[1]);
}

export function parseCode(htmlCode: string, cssCode?: string): CanvasElement[] {
  const elements: CanvasElement[] = [];

  try {
    // Set up real computed layout resolver frame
    const tempFrame = document.createElement('div');
    tempFrame.style.position = 'absolute';
    tempFrame.style.left = '-9999px';
    tempFrame.style.top = '-9999px';
    tempFrame.style.width = '1200px';
    tempFrame.style.height = '1200px';
    tempFrame.style.visibility = 'hidden';
    tempFrame.style.pointerEvents = 'none';

    if (cssCode) {
      const styleTag = document.createElement('style');
      styleTag.textContent = cssCode;
      tempFrame.appendChild(styleTag);
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlCode;
    tempFrame.appendChild(wrapper);
    document.body.appendChild(tempFrame);

    const canvasRoot = wrapper.querySelector('.canvas-container') || wrapper;
    const rootNodes = canvasRoot.children;

    const traverseNode = (node: Element): CanvasElement | null => {
      if (node.tagName.toLowerCase() === 'style' || node.tagName.toLowerCase() === 'script') {
        return null;
      }

      // Read explicit properties
      const id = node.getAttribute('id') || node.getAttribute('data-id') || `el-${Math.random().toString(36).substr(2, 9)}`;
      let typeAttr = node.getAttribute('data-type') as CanvasElement['type'] | null;
      
      // Auto guess type if missing (educational user-typed entries)
      if (!typeAttr) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'svg') {
          if (node.getAttribute('data-icon')) typeAttr = 'icon';
          else if (node.querySelector('polygon')) typeAttr = 'triangle';
          else if (node.querySelector('path')) typeAttr = 'path';
        } else if (tag === 'div') {
          const comp = window.getComputedStyle(node);
          if (comp.borderRadius === '50%') typeAttr = 'circle';
          else if (node.children.length > 0) typeAttr = 'container';
          else typeAttr = 'rect';
        } else {
          typeAttr = 'rect';
        }
      }

      const computed = window.getComputedStyle(node);

      // Core geometries (base values)
      const xVal = parseFloat(computed.left) || 0;
      const yVal = parseFloat(computed.top) || 0;
      const wVal = parseFloat(computed.width) || 100;
      const hVal = parseFloat(computed.height) || 100;
      const posVal = computed.position === 'absolute' ? 'absolute' : 'relative';

      const x: ResponsiveValue<number> = { base: xVal };
      const y: ResponsiveValue<number> = { base: yVal };
      const w: ResponsiveValue<number | string> = { base: wVal };
      const h: ResponsiveValue<number | string> = { base: hVal };
      const pos: ResponsiveValue<'absolute' | 'relative'> = { base: posVal };

      const fill = normalizeColor(computed.backgroundColor);
      const borderWidth = parseFloat(computed.borderWidth) || 0;
      const borderColor = normalizeColor(computed.borderColor) || '#000000';
      const borderRadius = parseFloat(computed.borderRadius) || 0;
      const opacity = computed.opacity !== '' ? parseFloat(computed.opacity) : 1;

      // Box model
      const margin: BoxModel = {
        top: parseFloat(computed.marginTop) || 0,
        right: parseFloat(computed.marginRight) || 0,
        bottom: parseFloat(computed.marginBottom) || 0,
        left: parseFloat(computed.marginLeft) || 0,
      };

      const padding: BoxModel = {
        top: parseFloat(computed.paddingTop) || 0,
        right: parseFloat(computed.paddingRight) || 0,
        bottom: parseFloat(computed.paddingBottom) || 0,
        left: parseFloat(computed.paddingLeft) || 0,
      };

      const styles: ElementStyles = {
        fill: fill === 'transparent' ? 'transparent' : fill,
        borderWidth,
        borderColor,
        borderRadius: typeAttr === 'rect' || typeAttr === 'container' ? borderRadius : undefined,
        opacity,
        margin,
        padding
      };

      // Flex properties
      if (computed.display === 'flex') {
        styles.gap = parseFloat(computed.gap) || 0;
        styles.alignItems = (computed.alignItems as any) || 'stretch';
        styles.justifyContent = (computed.justifyContent as any) || 'start';
      }

      // Check classes for Tailwind responsive coordinate prefix overrides
      const classAttr = node.getAttribute('class');
      if (classAttr) {
        classAttr.split(/\s+/).forEach((cls) => {
          if (cls) {
            parseTailwindClass(cls, x, y, w, h, pos, styles);
          }
        });
      }

      let iconName: string | undefined;
      let pathData: string | undefined;

      if (typeAttr === 'icon') {
        iconName = node.getAttribute('data-icon') || 'Star';
        styles.fill = normalizeColor(node.getAttribute('style')?.match(/color:\s*([^;]+)/)?.[1] || computed.color || '#3b82f6');
      } else if (typeAttr === 'path') {
        const pathNode = node.querySelector('path');
        if (pathNode) {
          pathData = pathNode.getAttribute('d') || '';
          styles.borderColor = normalizeColor(pathNode.getAttribute('stroke') || computed.stroke || '#000000');
          styles.borderWidth = parseFloat(pathNode.getAttribute('stroke-width') || computed.strokeWidth || '2');
        }
      } else if (typeAttr === 'triangle') {
        const polyNode = node.querySelector('polygon');
        if (polyNode) {
          styles.fill = normalizeColor(polyNode.getAttribute('fill') || '#3b82f6');
          styles.borderColor = normalizeColor(polyNode.getAttribute('stroke') || '#000000');
          styles.borderWidth = parseFloat(polyNode.getAttribute('stroke-width') || '0');
        }
      }

      // Children processing (filter out internal SVG polygons/paths)
      const children: CanvasElement[] = [];
      for (let i = 0; i < node.children.length; i++) {
        const childNode = node.children[i];
        if (typeAttr === 'icon' || typeAttr === 'path' || typeAttr === 'triangle') {
          // ignore SVGs internally
          continue;
        }
        if (childNode.tagName.toLowerCase() === 'polygon' || childNode.tagName.toLowerCase() === 'path') {
          continue;
        }
        
        const childEl = traverseNode(childNode);
        if (childEl) {
          children.push(childEl);
        }
      }

      return {
        id,
        type: typeAttr || 'rect',
        x,
        y,
        width: w,
        height: h,
        position: pos,
        styles,
        iconName,
        pathData,
        children
      };
    };

    for (let i = 0; i < rootNodes.length; i++) {
      const parsedRoot = traverseNode(rootNodes[i]);
      if (parsedRoot) {
        elements.push(parsedRoot);
      }
    }

    document.body.removeChild(tempFrame);
  } catch (error) {
    console.error('Error parsing HTML/CSS inputs into visual layout tree:', error);
  }

  return elements;
}
