import { CanvasElement } from '../types';

// Helper to parse hex/rgb color strings to hex
function normalizeColor(color: string): string {
  if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') return 'transparent';
  
  // If it's already hex, return it
  if (color.startsWith('#')) return color;
  
  // If it's rgb/rgba, convert to hex
  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  
  // Simple CSS named color fallbacks
  const namedColors: Record<string, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#10b981', yellow: '#f59e0b',
    black: '#000000', white: '#ffffff', gray: '#6b7280', transparent: 'transparent'
  };
  return namedColors[color.toLowerCase()] || color;
}

export function parseCode(htmlCode: string, cssCode?: string): CanvasElement[] {
  const elements: CanvasElement[] = [];
  
  try {
    // Create a temporary container in the real DOM to resolve CSS stylesheets
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '1200px';
    tempContainer.style.height = '1200px';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.pointerEvents = 'none';

    // 1. Add CSS styles if present
    if (cssCode) {
      const styleEl = document.createElement('style');
      styleEl.textContent = cssCode;
      tempContainer.appendChild(styleEl);
    }

    // 2. Add HTML elements
    const htmlWrapper = document.createElement('div');
    htmlWrapper.innerHTML = htmlCode;
    tempContainer.appendChild(htmlWrapper);

    // Append to body to compute layout
    document.body.appendChild(tempContainer);

    const container = htmlWrapper.querySelector('.canvas-container');
    const nodes = container ? container.children : htmlWrapper.children;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i] as HTMLElement;
      const type = node.getAttribute('data-type') as CanvasElement['type'] | null;
      
      if (!type) continue;
      
      const id = node.getAttribute('data-id') || node.id || `parsed-${Date.now()}-${i}`;
      
      // Get computed styles
      const computed = window.getComputedStyle(node);
      
      // Parse position and dimensions
      const x = parseFloat(computed.left) || 0;
      const y = parseFloat(computed.top) || 0;
      const width = parseFloat(computed.width) || 100;
      const height = parseFloat(computed.height) || 100;
      const opacity = computed.opacity !== '' ? parseFloat(computed.opacity) : 1;
      
      let fill = '#3b82f6';
      let borderWidth = 0;
      let borderColor = '#000000';
      let borderRadius = 0;
      let iconName: string | undefined;
      let pathData: string | undefined;
      
      switch (type) {
        case 'rect': {
          fill = normalizeColor(computed.backgroundColor);
          if (fill === 'transparent') fill = '#3b82f6'; // Default fallback
          
          // Parse border
          const borderW = parseFloat(computed.borderWidth) || 0;
          if (borderW > 0) {
            borderWidth = borderW;
            borderColor = normalizeColor(computed.borderColor);
          }
          
          borderRadius = parseFloat(computed.borderRadius) || 0;
          break;
        }
        case 'circle': {
          fill = normalizeColor(computed.backgroundColor);
          if (fill === 'transparent') fill = '#3b82f6';
          
          const borderW = parseFloat(computed.borderWidth) || 0;
          if (borderW > 0) {
            borderWidth = borderW;
            borderColor = normalizeColor(computed.borderColor);
          }
          break;
        }
        case 'triangle': {
          const polygon = node.querySelector('polygon');
          if (polygon) {
            const computedPoly = window.getComputedStyle(polygon);
            fill = normalizeColor(computedPoly.fill || polygon.getAttribute('fill') || '#3b82f6');
            borderColor = normalizeColor(computedPoly.stroke || polygon.getAttribute('stroke') || '#000000');
            borderWidth = parseFloat(computedPoly.strokeWidth || polygon.getAttribute('stroke-width') || '0');
          }
          break;
        }
        case 'icon': {
          iconName = node.getAttribute('data-icon') || 'Star';
          // Fill/color is mapped to the color computed style
          fill = normalizeColor(computed.color || node.getAttribute('stroke') || '#3b82f6');
          borderWidth = parseFloat(node.getAttribute('stroke-width') || computed.strokeWidth || '2');
          borderColor = fill;
          break;
        }
        case 'path': {
          const pathEl = node.querySelector('path');
          if (pathEl) {
            const computedPath = window.getComputedStyle(pathEl);
            pathData = pathEl.getAttribute('d') || '';
            borderColor = normalizeColor(computedPath.stroke || pathEl.getAttribute('stroke') || '#000000');
            borderWidth = parseFloat(computedPath.strokeWidth || pathEl.getAttribute('stroke-width') || '2');
          }
          break;
        }
      }
      
      elements.push({
        id,
        type,
        x,
        y,
        width,
        height,
        fill,
        borderWidth,
        borderColor,
        borderRadius: type === 'rect' ? borderRadius : undefined,
        opacity,
        iconName,
        pathData
      });
    }

    // Clean up from document body
    document.body.removeChild(tempContainer);
  } catch (error) {
    console.error('Error parsing HTML/CSS code to canvas elements:', error);
  }
  
  return elements;
}
