import { CanvasElement } from '../types';
import { ICONS_DATA } from './iconsData';

export interface GeneratedCode {
  html: string;
  css: string;
  inlineHtml: string;
}

export function generateCode(elements: CanvasElement[]): GeneratedCode {
  // 1. Generate Inline HTML
  const inlineElementsHtml = elements
    .map((el) => {
      const commonStyle = `position: absolute; left: ${Math.round(el.x)}px; top: ${Math.round(el.y)}px; width: ${Math.round(el.width)}px; height: ${Math.round(el.height)}px; opacity: ${el.opacity};`;
      
      switch (el.type) {
        case 'rect': {
          const borderStyle = el.borderWidth > 0 ? ` border: ${el.borderWidth}px solid ${el.borderColor};` : '';
          const radiusStyle = el.borderRadius && el.borderRadius > 0 ? ` border-radius: ${el.borderRadius}px;` : '';
          return `  <div data-id="${el.id}" data-type="rect" id="${el.id}" style="${commonStyle} background-color: ${el.fill};${borderStyle}${radiusStyle}"></div>`;
        }
        case 'circle': {
          const borderStyle = el.borderWidth > 0 ? ` border: ${el.borderWidth}px solid ${el.borderColor};` : '';
          return `  <div data-id="${el.id}" data-type="circle" id="${el.id}" style="${commonStyle} background-color: ${el.fill};${borderStyle} border-radius: 50%;"></div>`;
        }
        case 'triangle': {
          const strokeWidth = el.borderWidth;
          return `  <svg data-id="${el.id}" data-type="triangle" id="${el.id}" style="${commonStyle}" viewBox="0 0 100 100">
    <polygon points="50,0 100,100 0,100" fill="${el.fill}" stroke="${el.borderColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
  </svg>`;
        }
        case 'icon': {
          const innerPaths = ICONS_DATA[el.iconName || 'Star'] || '';
          return `  <svg data-id="${el.id}" data-type="icon" id="${el.id}" data-icon="${el.iconName || 'Star'}" style="${commonStyle} color: ${el.fill};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${el.borderWidth}" stroke-linecap="round" stroke-linejoin="round">
    ${innerPaths.trim()}
  </svg>`;
        }
        case 'path': {
          return `  <svg data-id="${el.id}" data-type="path" id="${el.id}" style="${commonStyle} overflow: visible;" viewBox="0 0 ${Math.max(1, Math.round(el.width))} ${Math.max(1, Math.round(el.height))}" fill="none">
    <path d="${el.pathData || ''}" stroke="${el.borderColor}" stroke-width="${el.borderWidth}" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;
        }
        default:
          return '';
      }
    })
    .join('\n');

  const inlineHtml = `<div class="canvas-container" style="position: relative; width: 100%; height: 100%; min-height: 500px; background-color: #0f172a; overflow: hidden; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
${inlineElementsHtml}
</div>`;

  // 2. Generate Separate HTML (without inline styles)
  const separateElementsHtml = elements
    .map((el) => {
      switch (el.type) {
        case 'rect':
          return `  <div data-id="${el.id}" data-type="rect" id="${el.id}"></div>`;
        case 'circle':
          return `  <div data-id="${el.id}" data-type="circle" id="${el.id}"></div>`;
        case 'triangle':
          return `  <svg data-id="${el.id}" data-type="triangle" id="${el.id}" viewBox="0 0 100 100">
    <polygon points="50,0 100,100 0,100" />
  </svg>`;
        case 'icon':
          const innerPaths = ICONS_DATA[el.iconName || 'Star'] || '';
          return `  <svg data-id="${el.id}" data-type="icon" id="${el.id}" data-icon="${el.iconName || 'Star'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    ${innerPaths.trim()}
  </svg>`;
        case 'path':
          return `  <svg data-id="${el.id}" data-type="path" id="${el.id}" viewBox="0 0 ${Math.max(1, Math.round(el.width))} ${Math.max(1, Math.round(el.height))}" fill="none">
    <path d="${el.pathData || ''}" />
  </svg>`;
        default:
          return '';
      }
    })
    .join('\n');

  const html = `<div class="canvas-container">
${separateElementsHtml}
</div>`;

  // 3. Generate CSS
  const cssRules = elements.map((el) => {
    const selector = `#${el.id}`;
    let rules = `position: absolute;
  left: ${Math.round(el.x)}px;
  top: ${Math.round(el.y)}px;
  width: ${Math.round(el.width)}px;
  height: ${Math.round(el.height)}px;
  opacity: ${el.opacity};`;

    switch (el.type) {
      case 'rect': {
        rules += `\n  background-color: ${el.fill};`;
        if (el.borderWidth > 0) {
          rules += `\n  border: ${el.borderWidth}px solid ${el.borderColor};`;
        }
        if (el.borderRadius && el.borderRadius > 0) {
          rules += `\n  border-radius: ${el.borderRadius}px;`;
        }
        return `${selector} {
  ${rules}
}`;
      }
      case 'circle': {
        rules += `\n  background-color: ${el.fill};`;
        if (el.borderWidth > 0) {
          rules += `\n  border: ${el.borderWidth}px solid ${el.borderColor};`;
        }
        rules += `\n  border-radius: 50%;`;
        return `${selector} {
  ${rules}
}`;
      }
      case 'triangle': {
        const strokeWidth = el.borderWidth;
        const mainRule = `${selector} {
  ${rules}
}`;
        const polygonRule = `${selector} polygon {
  fill: ${el.fill};
  stroke: ${el.borderColor};
  stroke-width: ${strokeWidth}px;
  stroke-linejoin: round;
}`;
        return `${mainRule}\n\n${polygonRule}`;
      }
      case 'icon': {
        const mainRule = `${selector} {
  ${rules}
  color: ${el.fill};
}`;
        const svgRule = `${selector} {
  stroke-width: ${el.borderWidth}px;
}`;
        return `${mainRule}\n\n${svgRule}`;
      }
      case 'path': {
        const mainRule = `${selector} {
  ${rules}
  overflow: visible;
}`;
        const pathRule = `${selector} path {
  stroke: ${el.borderColor};
  stroke-width: ${el.borderWidth}px;
  stroke-linecap: round;
  stroke-linejoin: round;
}`;
        return `${mainRule}\n\n${pathRule}`;
      }
      default:
        return '';
    }
  });

  const css = `.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  background-color: #0f172a;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

${cssRules.join('\n\n')}`;

  return { html, css, inlineHtml };
}
