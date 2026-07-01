export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveValue<T> {
  base: T;         // Mobile (default)
  md?: T;          // Tablet override
  lg?: T;          // Desktop override
}

export interface BoxModel {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ElementStyles {
  fill: string;
  borderColor: string;
  borderWidth: number;
  borderRadius?: number; // rect corner radius (pixels)
  opacity: number;
  padding: BoxModel;
  margin: BoxModel;
  
  // Flexbox container properties
  gap?: number;
  alignItems?: 'stretch' | 'center' | 'start' | 'end';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export interface CanvasElement {
  id: string;
  type: 'rect' | 'circle' | 'triangle' | 'icon' | 'path' | 'container';
  
  // Positions and dimensions are responsive
  x: ResponsiveValue<number>;
  y: ResponsiveValue<number>;
  width: ResponsiveValue<number | string>;
  height: ResponsiveValue<number | string>;
  
  position: ResponsiveValue<'absolute' | 'relative'>;
  
  styles: ElementStyles;
  iconName?: string;
  pathData?: string;     // For pen drawn SVG paths
  children?: CanvasElement[];
}

export type ActiveTool = 'select' | 'rect' | 'circle' | 'triangle' | 'icon' | 'draw' | 'container';

export interface StyleSettings {
  fill: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  opacity: number;
}

export interface GeneratedCode {
  html: string;
  css: string;
  inlineHtml: string;
  tailwindHtml: string; // Tailwind compile output
}
