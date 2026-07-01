import React from 'react';
import { 
  MousePointer, 
  Square, 
  Circle, 
  Triangle, 
  PenTool, 
  Smile,
  Star,
  Heart,
  Check,
  X,
  Search,
  Home,
  Settings,
  User,
  Bell,
  Camera,
  Mail
} from 'lucide-react';
import { ActiveTool } from '../types';

interface SidebarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onAddIcon: (iconName: string) => void;
}

// Icon component lookup map for UI rendering
const UI_ICONS: Record<string, React.ComponentType<any>> = {
  Star,
  Heart,
  Smile,
  Check,
  X,
  Search,
  Home,
  Settings,
  User,
  Bell,
  Camera,
  Mail
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTool, 
  setActiveTool, 
  onAddIcon 
}) => {
  const tools = [
    { id: 'select', label: 'Select & Move', icon: MousePointer, description: 'Drag, resize and style shapes' },
    { id: 'rect', label: 'Rectangle', icon: Square, description: 'Draw a rectangle element' },
    { id: 'circle', label: 'Circle', icon: Circle, description: 'Draw a circular element' },
    { id: 'triangle', label: 'Triangle', icon: Triangle, description: 'Draw a triangular element' },
    { id: 'draw', label: 'Pen Tool', icon: PenTool, description: 'Freehand sketch custom paths' },
    { id: 'icon', label: 'Add Icon', icon: Smile, description: 'Insert standard UI icons' },
  ] as const;

  return (
    <div className="w-full bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-white text-base">C</span>
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 tracking-wide text-sm">Canvify</h1>
            <p className="text-xs text-slate-500">Visual Code Builder</p>
          </div>
        </div>
      </div>

      {/* Toolbar List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Tools</p>
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={tool.description}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium tracking-wide">{tool.label}</span>
                <span className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {tool.description}
                </span>
              </div>
            </button>
          );
        })}

        {/* Custom Icon Picker Sub-Panel */}
        {activeTool === 'icon' && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 animate-fadeIn">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-3">
              Click Icon to Add
            </p>
            <div className="grid grid-cols-4 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/40">
              {Object.entries(UI_ICONS).map(([name, Component]) => (
                <button
                  key={name}
                  onClick={() => onAddIcon(name)}
                  className="aspect-square flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all group"
                  title={name}
                >
                  <Component className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 flex flex-col gap-1 bg-slate-950/30">
        <div className="flex justify-between">
          <span>Shortcuts:</span>
          <span>Del to delete</span>
        </div>
        <div className="flex justify-between">
          <span>Move:</span>
          <span>Drag or arrows</span>
        </div>
      </div>
    </div>
  );
};
