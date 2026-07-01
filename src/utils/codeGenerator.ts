import { CanvasElement, GeneratedCode, BoxModel } from '../types';
import { getIconSvgContent } from './lucideIcons';

// Helper to format BoxModel properties
function formatBoxModelCss(prefix: 'margin' | 'padding', box: BoxModel): string {
  const t = box.top;
  const r = box.right;
  const b = box.bottom;
  const l = box.left;
  if (t === r && r === b && b === l) {
    return t > 0 ? `\n  ${prefix}: ${t}px;` : '';
  }
  return `\n  ${prefix}: ${t}px ${r}px ${b}px ${l}px;`;
}

// Convert Box Model styles to Tailwind classes
function boxModelToTailwind(prefix: 'm' | 'p', box: BoxModel): string {
  const t = box.top;
  const r = box.right;
  const b = box.bottom;
  const l = box.left;
  if (t === r && r === b && b === l) {
    return t > 0 ? `${prefix}-[${t}px]` : '';
  }
  
  const classes: string[] = [];
  if (t > 0) classes.push(`${prefix}t-[${t}px]`);
  if (r > 0) classes.push(`${prefix}r-[${r}px]`);
  if (b > 0) classes.push(`${prefix}b-[${b}px]`);
  if (l > 0) classes.push(`${prefix}l-[${l}px]`);
  return classes.join(' ');
}

// Compile tree node to Tailwind utility class string
export function compileTailwindClasses(el: CanvasElement): string {
  const classes: string[] = [];

  // 1. Core element shapes & layouts
  if (el.type === 'container') {
    classes.push('flex');
    classes.push(el.styles.gap && el.styles.gap > 0 ? `gap-[${el.styles.gap}px]` : 'gap-4');
    
    // flex direction
    if (el.styles.alignItems || el.styles.justifyContent) {
      classes.push(el.styles.alignItems === 'center' ? 'items-center' : 'items-stretch');
      classes.push(el.styles.justifyContent === 'center' ? 'justify-center' : 'justify-start');
    }
  } else if (el.type === 'circle') {
    classes.push('rounded-full');
  } else if (el.type === 'rect') {
    if (el.styles.borderRadius && el.styles.borderRadius > 0) {
      classes.push(`rounded-[${el.styles.borderRadius}px]`);
    }
  }

  // 2. Geometry dimensions (Responsive values)
  // Width
  if (el.width.base !== undefined) {
    classes.push(typeof el.width.base === 'number' ? `w-[${el.width.base}px]` : `w-${el.width.base}`);
  }
  if (el.width.md !== undefined) {
    classes.push(typeof el.width.md === 'number' ? `md:w-[${el.width.md}px]` : `md:w-${el.width.md}`);
  }
  if (el.width.lg !== undefined) {
    classes.push(typeof el.width.lg === 'number' ? `lg:w-[${el.width.lg}px]` : `lg:w-${el.width.lg}`);
  }

  // Height
  if (el.height.base !== undefined) {
    classes.push(typeof el.height.base === 'number' ? `h-[${el.height.base}px]` : `h-${el.height.base}`);
  }
  if (el.height.md !== undefined) {
    classes.push(typeof el.height.md === 'number' ? `md:h-[${el.height.md}px]` : `md:h-${el.height.md}`);
  }
  if (el.height.lg !== undefined) {
    classes.push(typeof el.height.lg === 'number' ? `lg:h-[${el.height.lg}px]` : `lg:h-${el.height.lg}`);
  }

  // 3. Positioning (Responsive values)
  if (el.position.base === 'absolute') {
    classes.push('absolute');
    
    // X Coordinate
    if (el.x.base !== undefined) classes.push(`left-[${el.x.base}px]`);
    if (el.x.md !== undefined) classes.push(`md:left-[${el.x.md}px]`);
    if (el.x.lg !== undefined) classes.push(`lg:left-[${el.x.lg}px]`);
    
    // Y Coordinate
    if (el.y.base !== undefined) classes.push(`top-[${el.y.base}px]`);
    if (el.y.md !== undefined) classes.push(`md:top-[${el.y.md}px]`);
    if (el.y.lg !== undefined) classes.push(`lg:top-[${el.y.lg}px]`);
  } else {
    classes.push('relative');
  }

  // 4. Styles
  // Fill
  if (el.styles.fill && el.styles.fill !== 'transparent' && el.type !== 'icon' && el.type !== 'path') {
    classes.push(`bg-[${el.styles.fill}]`);
  }
  
  // Border
  if (el.styles.borderWidth > 0) {
    classes.push(`border-[${el.styles.borderWidth}px]`);
    classes.push(`border-[${el.styles.borderColor}]`);
  }

  // Opacity
  if (el.styles.opacity < 1.0) {
    classes.push(`opacity-[${el.styles.opacity}]`);
  }

  // Margin & Padding
  const marginClasses = boxModelToTailwind('m', el.styles.margin);
  const paddingClasses = boxModelToTailwind('p', el.styles.padding);
  
  if (marginClasses) classes.push(marginClasses);
  if (paddingClasses) classes.push(paddingClasses);

  return classes.filter(Boolean).join(' ');
}

// Compile tree node to inline style CSS string
export function compileInlineStyle(el: CanvasElement, viewport: 'base' | 'md' | 'lg' = 'base'): string {
  const styles: string[] = [];

  // Geometry
  const x = viewport === 'lg' ? (el.x.lg ?? el.x.md ?? el.x.base) : viewport === 'md' ? (el.x.md ?? el.x.base) : el.x.base;
  const y = viewport === 'lg' ? (el.y.lg ?? el.y.md ?? el.y.base) : viewport === 'md' ? (el.y.md ?? el.y.base) : el.y.base;
  const w = viewport === 'lg' ? (el.width.lg ?? el.width.md ?? el.width.base) : viewport === 'md' ? (el.width.md ?? el.width.base) : el.width.base;
  const h = viewport === 'lg' ? (el.height.lg ?? el.height.md ?? el.height.base) : viewport === 'md' ? (el.height.md ?? el.height.base) : el.height.base;
  const pos = viewport === 'lg' ? (el.position.lg ?? el.position.md ?? el.position.base) : viewport === 'md' ? (el.position.md ?? el.position.base) : el.position.base;

  if (pos === 'absolute') {
    styles.push('position: absolute;');
    styles.push(`left: ${x}px;`);
    styles.push(`top: ${y}px;`);
  } else {
    styles.push('position: relative;');
  }

  styles.push(typeof w === 'number' ? `width: ${w}px;` : `width: ${w};`);
  styles.push(typeof h === 'number' ? `height: ${h}px;` : `height: ${h};`);

  // Fill
  if (el.styles.fill && el.type !== 'icon' && el.type !== 'path') {
    styles.push(`background-color: ${el.styles.fill};`);
  }

  // Border & stroke
  if (el.styles.borderWidth > 0) {
    styles.push(`border: ${el.styles.borderWidth}px solid ${el.styles.borderColor};`);
  }

  // Rounding
  if (el.type === 'circle') {
    styles.push('border-radius: 50%;');
  } else if (el.type === 'rect' && el.styles.borderRadius && el.styles.borderRadius > 0) {
    styles.push(`border-radius: ${el.styles.borderRadius}px;`);
  }

  // Opacity
  if (el.styles.opacity < 1.0) {
    styles.push(`opacity: ${el.styles.opacity};`);
  }

  // Margins & paddings
  const m = el.styles.margin;
  if (m.top > 0 || m.right > 0 || m.bottom > 0 || m.left > 0) {
    styles.push(`margin: ${m.top}px ${m.right}px ${m.bottom}px ${m.left}px;`);
  }
  
  const p = el.styles.padding;
  if (p.top > 0 || p.right > 0 || p.bottom > 0 || p.left > 0) {
    styles.push(`padding: ${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;`);
  }

  // Flexbox configurations
  if (el.type === 'container') {
    styles.push('display: flex;');
    styles.push(`flex-direction: ${el.styles.alignItems ? 'column' : 'row'};`);
    styles.push(`gap: ${el.styles.gap || 16}px;`);
    if (el.styles.alignItems) styles.push(`align-items: ${el.styles.alignItems};`);
    if (el.styles.justifyContent) styles.push(`justify-content: ${el.styles.justifyContent};`);
  }

  return styles.join(' ');
}

// Generate code artifact from JSON tree recursively
export function generateCode(elements: CanvasElement[]): GeneratedCode {
  // 1. Generate Tailwind HTML
  const buildTailwindHtml = (nodes: CanvasElement[], indent = 2): string => {
    const spaces = ' '.repeat(indent);
    return nodes
      .map((el) => {
        const twClasses = compileTailwindClasses(el);
        const childCode = el.children && el.children.length > 0 
          ? `\n${buildTailwindHtml(el.children, indent + 2)}\n${spaces}` 
          : '';

        switch (el.type) {
          case 'container':
          case 'rect':
          case 'circle': {
            const tagName = el.type === 'container' ? 'div' : 'div';
            return `${spaces}<${tagName} id="${el.id}" data-id="${el.id}" data-type="${el.type}" class="${twClasses}">${childCode}</${tagName}>`;
          }
          case 'triangle': {
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="triangle" class="${twClasses}" viewBox="0 0 100 100">
${spaces}  <polygon points="50,0 100,100 0,100" fill="${el.styles.fill}" stroke="${el.styles.borderColor}" stroke-width="${el.styles.borderWidth}" stroke-linejoin="round" />
${spaces}</svg>`;
          }
          case 'icon': {
            const paths = getIconSvgContent(el.iconName || 'Star');
            const color = el.styles.fill || '#3b82f6';
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="icon" data-icon="${el.iconName || 'Star'}" class="${twClasses}" style="color: ${color};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${el.styles.borderWidth || 2}" stroke-linecap="round" stroke-linejoin="round">
${spaces}  ${paths.trim()}
${spaces}</svg>`;
          }
          case 'path': {
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="path" class="${twClasses} overflow-visible" fill="none">
${spaces}  <path d="${el.pathData || ''}" stroke="${el.styles.borderColor}" stroke-width="${el.styles.borderWidth || 2}" stroke-linecap="round" stroke-linejoin="round" />
${spaces}</svg>`;
          }
          default:
            return '';
        }
      })
      .join('\n');
  };

  // 2. Generate Inline HTML
  const buildInlineHtml = (nodes: CanvasElement[], indent = 2): string => {
    const spaces = ' '.repeat(indent);
    return nodes
      .map((el) => {
        const inlineStyle = compileInlineStyle(el, 'base');
        const childCode = el.children && el.children.length > 0 
          ? `\n${buildInlineHtml(el.children, indent + 2)}\n${spaces}` 
          : '';

        switch (el.type) {
          case 'container':
          case 'rect':
          case 'circle': {
            return `${spaces}<div id="${el.id}" data-id="${el.id}" data-type="${el.type}" style="${inlineStyle}">${childCode}</div>`;
          }
          case 'triangle': {
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="triangle" style="${inlineStyle}" viewBox="0 0 100 100">
${spaces}  <polygon points="50,0 100,100 0,100" fill="${el.styles.fill}" stroke="${el.styles.borderColor}" stroke-width="${el.styles.borderWidth}" stroke-linejoin="round" />
${spaces}</svg>`;
          }
          case 'icon': {
            const paths = getIconSvgContent(el.iconName || 'Star');
            const color = el.styles.fill || '#3b82f6';
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="icon" data-icon="${el.iconName || 'Star'}" style="${inlineStyle} color: ${color};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${el.styles.borderWidth || 2}" stroke-linecap="round" stroke-linejoin="round">
${spaces}  ${paths.trim()}
${spaces}</svg>`;
          }
          case 'path': {
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="path" style="${inlineStyle} overflow: visible;" fill="none">
${spaces}  <path d="${el.pathData || ''}" stroke="${el.styles.borderColor}" stroke-width="${el.styles.borderWidth || 2}" stroke-linecap="round" stroke-linejoin="round" />
${spaces}</svg>`;
          }
          default:
            return '';
        }
      })
      .join('\n');
  };

  // 3. Generate Separate HTML (without style tags)
  const buildSeparateHtml = (nodes: CanvasElement[], indent = 2): string => {
    const spaces = ' '.repeat(indent);
    return nodes
      .map((el) => {
        const childCode = el.children && el.children.length > 0 
          ? `\n${buildSeparateHtml(el.children, indent + 2)}\n${spaces}` 
          : '';

        switch (el.type) {
          case 'container':
          case 'rect':
          case 'circle': {
            return `${spaces}<div id="${el.id}" data-id="${el.id}" data-type="${el.type}">${childCode}</div>`;
          }
          case 'triangle': {
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="triangle" viewBox="0 0 100 100">
${spaces}  <polygon points="50,0 100,100 0,100" />
${spaces}</svg>`;
          }
          case 'icon': {
            const paths = getIconSvgContent(el.iconName || 'Star');
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="icon" data-icon="${el.iconName || 'Star'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
${spaces}  ${paths.trim()}
${spaces}</svg>`;
          }
          case 'path': {
            return `${spaces}<svg id="${el.id}" data-id="${el.id}" data-type="path" fill="none">
${spaces}  <path d="${el.pathData || ''}" />
${spaces}</svg>`;
          }
          default:
            return '';
        }
      })
      .join('\n');
  };

  // 4. Generate Separate CSS Declarations
  const buildSeparateCss = (nodes: CanvasElement[]): string[] => {
    const rules: string[] = [];
    
    const parseNode = (el: CanvasElement) => {
      let cssRule = `#${el.id} {`;
      
      // Responsive layout positions
      cssRule += `\n  position: ${el.position.base};`;
      if (el.position.base === 'absolute') {
        cssRule += `\n  left: ${el.x.base}px;`;
        cssRule += `\n  top: ${el.y.base}px;`;
      }
      cssRule += `\n  width: ${typeof el.width.base === 'number' ? el.width.base + 'px' : el.width.base};`;
      cssRule += `\n  height: ${typeof el.height.base === 'number' ? el.height.base + 'px' : el.height.base};`;

      // Fill / colors
      if (el.styles.fill && el.type !== 'icon' && el.type !== 'path') {
        cssRule += `\n  background-color: ${el.styles.fill};`;
      }
      if (el.styles.borderWidth > 0) {
        cssRule += `\n  border: ${el.styles.borderWidth}px solid ${el.styles.borderColor};`;
      }
      if (el.type === 'circle') {
        cssRule += `\n  border-radius: 50%;`;
      } else if (el.type === 'rect' && el.styles.borderRadius && el.styles.borderRadius > 0) {
        cssRule += `\n  border-radius: ${el.styles.borderRadius}px;`;
      }
      if (el.styles.opacity < 1.0) {
        cssRule += `\n  opacity: ${el.styles.opacity};`;
      }

      // Box model
      cssRule += formatBoxModelCss('margin', el.styles.margin);
      cssRule += formatBoxModelCss('padding', el.styles.padding);

      // Container flex layouts
      if (el.type === 'container') {
        cssRule += `\n  display: flex;`;
        cssRule += `\n  flex-direction: ${el.styles.alignItems ? 'column' : 'row'};`;
        cssRule += `\n  gap: ${el.styles.gap || 16}px;`;
        if (el.styles.alignItems) cssRule += `\n  align-items: ${el.styles.alignItems};`;
        if (el.styles.justifyContent) cssRule += `\n  justify-content: ${el.styles.justifyContent};`;
      }

      cssRule += '\n}';
      rules.push(cssRule);

      // Handle custom inner paths/svgs if needed
      if (el.type === 'triangle') {
        rules.push(`#${el.id} polygon {
  fill: ${el.styles.fill};
  stroke: ${el.styles.borderColor};
  stroke-width: ${el.styles.borderWidth}px;
  stroke-linejoin: round;
}`);
      } else if (el.type === 'icon') {
        rules.push(`#${el.id} {
  color: ${el.styles.fill};
}
#${el.id} path, #${el.id} circle, #${el.id} polygon, #${el.id} line, #${el.id} polyline {
  stroke-width: ${el.styles.borderWidth || 2}px;
}`);
      } else if (el.type === 'path') {
        rules.push(`#${el.id} path {
  stroke: ${el.styles.borderColor};
  stroke-width: ${el.styles.borderWidth || 2}px;
  stroke-linecap: round;
  stroke-linejoin: round;
}`);
      }

      // Breakpoints
      if (el.x.md !== undefined || el.y.md !== undefined || el.width.md !== undefined || el.height.md !== undefined) {
        let mdRule = `@media (min-width: 768px) {\n  #${el.id} {`;
        if (el.x.md !== undefined) mdRule += `\n    left: ${el.x.md}px;`;
        if (el.y.md !== undefined) mdRule += `\n    top: ${el.y.md}px;`;
        if (el.width.md !== undefined) mdRule += `\n    width: ${typeof el.width.md === 'number' ? el.width.md + 'px' : el.width.md};`;
        if (el.height.md !== undefined) mdRule += `\n    height: ${typeof el.height.md === 'number' ? el.height.md + 'px' : el.height.md};`;
        mdRule += `\n  }\n}`;
        rules.push(mdRule);
      }

      if (el.x.lg !== undefined || el.y.lg !== undefined || el.width.lg !== undefined || el.height.lg !== undefined) {
        let lgRule = `@media (min-width: 1024px) {\n  #${el.id} {`;
        if (el.x.lg !== undefined) lgRule += `\n    left: ${el.x.lg}px;`;
        if (el.y.lg !== undefined) lgRule += `\n    top: ${el.y.lg}px;`;
        if (el.width.lg !== undefined) lgRule += `\n    width: ${typeof el.width.lg === 'number' ? el.width.lg + 'px' : el.width.lg};`;
        if (el.height.lg !== undefined) lgRule += `\n    height: ${typeof el.height.lg === 'number' ? el.height.lg + 'px' : el.height.lg};`;
        lgRule += `\n  }\n}`;
        rules.push(lgRule);
      }

      if (el.children) {
        el.children.forEach(parseNode);
      }
    };

    nodes.forEach(parseNode);
    return rules;
  };

  const separateHtmlOutput = `<div class="canvas-container">\n${buildSeparateHtml(elements, 2)}\n</div>`;
  const separateCssOutput = `.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  background-color: #0f172a;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

${buildSeparateCss(elements).join('\n\n')}`;

  const inlineHtmlOutput = `<div class="canvas-container" style="position: relative; width: 100%; height: 100%; min-height: 500px; background-color: #0f172a; overflow: hidden; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
${buildInlineHtml(elements, 2)}
</div>`;

  const tailwindHtmlOutput = `<div class="canvas-container relative w-full h-full min-h-[500px] bg-[#0f172a] overflow-hidden rounded-xl shadow-2xl">
${buildTailwindHtml(elements, 2)}
</div>`;

  return {
    html: separateHtmlOutput,
    css: separateCssOutput,
    inlineHtml: inlineHtmlOutput,
    tailwindHtml: tailwindHtmlOutput
  };
}
