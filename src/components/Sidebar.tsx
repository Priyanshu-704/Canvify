import React, { useState, useMemo } from 'react';
import { 
  MousePointer, 
  Square, 
  Circle, 
  Triangle, 
  PenTool, 
  Smile,
  Layout // container icon
} from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { CanvasElement } from '../types';
import { ALL_ICONS, getIconComponent } from '../utils/lucideIcons';

export const Sidebar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    addElement,
    setSelectedId
  } = useCanvas();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [
        'Star', 'Heart', 'Smile', 'Check', 'X', 'Search', 'Home', 'Settings', 
        'User', 'Bell', 'Camera', 'Mail', 'ThumbsUp', 'MapPin', 'Calendar', 
        'Trash2', 'Plus', 'Play', 'Info', 'HelpCircle', 'Folder', 'Copy', 
        'Share2', 'LogOut', 'Activity', 'AlertTriangle', 'Book', 'Briefcase',
        'Cloud', 'CreditCard', 'Download', 'Eye', 'Gift', 'Image',
        'Lock', 'MessageSquare', 'Music', 'Phone', 'Send', 'ShoppingCart',
        'Sliders', 'Smartphone', 'Sun', 'Video', 'Volume2', 'Wifi', 'Zap'
      ];
    }
    return ALL_ICONS.filter(name => name.toLowerCase().includes(query)).slice(0, 48);
  }, [searchQuery]);
  const tools = [
    { id: 'select', label: 'Select & Move', icon: MousePointer, description: 'Drag, resize and style shapes' },
    { id: 'container', label: 'Flex Container', icon: Layout, description: 'Draw a flexible parent layout wrapper' },
    { id: 'rect', label: 'Rectangle', icon: Square, description: 'Draw a rectangle element' },
    { id: 'circle', label: 'Circle', icon: Circle, description: 'Draw a circular element' },
    { id: 'triangle', label: 'Triangle', icon: Triangle, description: 'Draw a triangular element' },
    { id: 'draw', label: 'Pen Tool', icon: PenTool, description: 'Freehand sketch custom paths' },
    { id: 'icon', label: 'Add Icon', icon: Smile, description: 'Insert standard UI icons' },
  ] as const;

  const handleAddIcon = (iconName: string) => {
    const newIcon: CanvasElement = {
      id: `icon-${Date.now()}`,
      type: 'icon',
      x: { base: 60 },
      y: { base: 60 },
      width: { base: 48 },
      height: { base: 48 },
      position: { base: 'absolute' },
      iconName,
      styles: {
        fill: '#fbbf24', // Amber icon color default
        borderColor: '#d97706',
        borderWidth: 1.5,
        opacity: 1.0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      }
    };
    addElement(newIcon);
    setSelectedId(newIcon.id);
    setActiveTool('select');
  };

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
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Workspace Tools</p>
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
                <span className="text-xs font-semibold tracking-wide">{tool.label}</span>
                <span className={`text-[9px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {tool.description}
                </span>
              </div>
            </button>
          );
        })}

        {/* Custom Icon Picker Sub-Panel */}
        {activeTool === 'icon' && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 animate-fadeIn flex flex-col gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
                Search & Add Icon
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 1,000+ icons..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-200 outline-none transition-all placeholder-slate-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[16px] leading-none px-1"
                    title="Clear search"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/40">
                  {filteredIcons.map((name) => {
                    const Component = getIconComponent(name);
                    return (
                      <button
                        key={name}
                        onClick={() => handleAddIcon(name)}
                        className="aspect-square flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all group"
                        title={name}
                      >
                        <Component className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-600 border border-dashed border-slate-800 rounded-lg">
                  No icons found.
                </div>
              )}
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
