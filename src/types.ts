export interface CanvasElement {
  id: string;
  type: 'rect' | 'circle' | 'triangle' | 'icon' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  borderWidth: number;
  borderColor: string;
  borderRadius?: number; // For rects (in pixels)
  opacity: number;
  iconName?: string;     // For lucide icons
  pathData?: string;     // For free-draw path
}

export type ActiveTool = 'select' | 'rect' | 'circle' | 'triangle' | 'icon' | 'draw';

export interface StyleSettings {
  fill: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  opacity: number;
}
