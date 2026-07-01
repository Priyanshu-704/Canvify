import React from 'react';
import * as Icons from 'lucide-react';

// Get all icon keys from lucide-react exports
export const ALL_ICONS = Object.keys(Icons).filter(key => {
  // Filter out duplicate *Icon components, helpers, and types
  return (
    key[0] === key[0].toUpperCase() &&
    !key.endsWith('Icon') &&
    typeof (Icons as any)[key] === 'object'
  );
}).sort();

/**
 * Returns the Lucide icon React component by name. Falls back to Star if not found.
 */
export function getIconComponent(name: string): React.ComponentType<any> {
  return (Icons as any)[name] || Icons.Star;
}

/**
 * Converts camelCase React props to kebab-case SVG attributes
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Renders a Lucide icon component to an inner SVG HTML string at runtime.
 * This is used for generating raw HTML codes without React dependencies.
 */
export function getIconSvgContent(iconName: string): string {
  const IconComponent = (Icons as any)[iconName];
  if (!IconComponent || !IconComponent.render) {
    return '';
  }

  try {
    const el = IconComponent.render({ size: 24 }, null);
    if (!el || !el.props || !el.props.children) {
      return '';
    }

    const children = Array.isArray(el.props.children)
      ? el.props.children
      : [el.props.children];

    return children
      .filter(Boolean)
      .map((child: any) => {
        const type = child.type;
        const props = child.props || {};
        const propsStr = Object.entries(props)
          .filter(([key]) => key !== 'children')
          .map(([key, val]) => `${camelToKebab(key)}="${val}"`)
          .join(' ');
        
        if (props.children) {
          return `<${type} ${propsStr}>${props.children}</${type}>`;
        }
        return `<${type} ${propsStr} />`;
      })
      .join('');
  } catch (err) {
    console.error(`Error rendering icon ${iconName} to SVG string:`, err);
    return '';
  }
}
