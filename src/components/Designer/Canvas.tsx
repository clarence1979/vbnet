import { useCallback, useRef, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { ComponentType } from '../../types/component.types';
import { snapToGrid } from '../../utils/defaults';
import DesignComponent from './DesignComponent';
import ContextMenu from './ContextMenu';

interface DragState {
  type: 'move' | 'resize';
  id: string;
  startX: number;
  startY: number;
  origLeft: number;
  origTop: number;
  origWidth: number;
  origHeight: number;
  handle?: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  componentId: string;
}

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const formSettings = useProjectStore((s) => s.formSettings);
  const components = useProjectStore((s) => s.components);
  const selectedIds = useProjectStore((s) => s.selectedIds);
  const addComponent = useProjectStore((s) => s.addComponent);
  const updateComponent = useProjectStore((s) => s.updateComponent);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const toggleSelectedId = useProjectStore((s) => s.toggleSelectedId);
  const clearSelection = useProjectStore((s) => s.clearSelection);
  const pushHistory = useProjectStore((s) => s.pushHistory);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const setCodeEditorTarget = useProjectStore((s) => s.setCodeEditorTarget);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('componentType') as ComponentType;
      if (!type || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addComponent(type, x, y);
    },
    [addComponent]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        clearSelection();
      }
      setContextMenu(null);
    },
    [clearSelection]
  );

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        setCodeEditorTarget(formSettings.name);
        setViewMode('code');
      }
    },
    [formSettings.name, setCodeEditorTarget, setViewMode]
  );

  const handleComponentMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey) {
        toggleSelectedId(id);
        return;
      }
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }
      pushHistory();
      const comp = components.find((c) => c.id === id);
      if (!comp) return;
      setDragState({
        type: 'move',
        id,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: comp.left,
        origTop: comp.top,
        origWidth: comp.width,
        origHeight: comp.height,
      });

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - e.clientX;
        const dy = ev.clientY - e.clientY;
        let newLeft = comp.left + dx;
        let newTop = comp.top + dy;
        if (formSettings.snapToGrid) {
          newLeft = snapToGrid(newLeft, formSettings.gridSize);
          newTop = snapToGrid(newTop, formSettings.gridSize);
        }
        newLeft = Math.max(0, Math.min(newLeft, formSettings.width - comp.width));
        newTop = Math.max(0, Math.min(newTop, formSettings.height - comp.height));
        updateComponent(id, { left: newLeft, top: newTop });
      };

      const handleMouseUp = () => {
        setDragState(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [selectedIds, components, formSettings, setSelectedIds, toggleSelectedId, updateComponent, pushHistory]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, id: string, handle: string) => {
      e.stopPropagation();
      pushHistory();
      const comp = components.find((c) => c.id === id);
      if (!comp) return;
      setDragState({
        type: 'resize',
        id,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: comp.left,
        origTop: comp.top,
        origWidth: comp.width,
        origHeight: comp.height,
        handle,
      });

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - e.clientX;
        const dy = ev.clientY - e.clientY;
        let newLeft = comp.left;
        let newTop = comp.top;
        let newWidth = comp.width;
        let newHeight = comp.height;

        if (handle.includes('e')) newWidth = Math.max(10, comp.width + dx);
        if (handle.includes('w')) {
          newWidth = Math.max(10, comp.width - dx);
          newLeft = comp.left + (comp.width - newWidth);
        }
        if (handle.includes('s')) newHeight = Math.max(10, comp.height + dy);
        if (handle.includes('n')) {
          newHeight = Math.max(10, comp.height - dy);
          newTop = comp.top + (comp.height - newHeight);
        }

        if (formSettings.snapToGrid) {
          newLeft = snapToGrid(newLeft, formSettings.gridSize);
          newTop = snapToGrid(newTop, formSettings.gridSize);
          newWidth = snapToGrid(newWidth, formSettings.gridSize);
          newHeight = snapToGrid(newHeight, formSettings.gridSize);
        }

        updateComponent(id, { left: newLeft, top: newTop, width: newWidth, height: newHeight });
      };

      const handleMouseUp = () => {
        setDragState(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [components, formSettings, updateComponent, pushHistory]
  );

  const handleDoubleClick = useCallback(
    (id: string) => {
      const comp = components.find((c) => c.id === id);
      if (!comp) return;
      setCodeEditorTarget(comp.name);
      setViewMode('code');
    },
    [components, setCodeEditorTarget, setViewMode]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = [...components].reverse().find(
        (c) => x >= c.left && x <= c.left + c.width && y >= c.top && y <= c.top + c.height
      );
      if (hit) {
        if (!selectedIds.includes(hit.id)) {
          setSelectedIds([hit.id]);
        }
        setContextMenu({ x, y, componentId: hit.id });
      }
    },
    [components, selectedIds, setSelectedIds]
  );

  const gridBg = formSettings.showGrid
    ? {
        backgroundImage: `radial-gradient(circle, #C0C0C0 1px, transparent 1px)`,
        backgroundSize: `${formSettings.gridSize}px ${formSettings.gridSize}px`,
      }
    : {};

  return (
    <div className="flex-1 bg-[#2D2D2D] overflow-auto flex items-start justify-center p-8">
      <div className="relative shadow-xl">
        <div className="bg-[#0078D4] h-8 flex items-center px-3 rounded-t-lg" style={{ width: formSettings.width }}>
          <span className="text-white text-xs font-medium">{formSettings.text}</span>
          <div className="ml-auto flex items-center">
            <div className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 transition-colors cursor-default">
              <Minus size={12} className="text-white" />
            </div>
            <div className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 transition-colors cursor-default">
              <Square size={10} className="text-white" />
            </div>
            <div className="w-[46px] h-8 flex items-center justify-center hover:bg-[#E81123] rounded-tr-lg transition-colors cursor-default">
              <X size={14} className="text-white" />
            </div>
          </div>
        </div>
        <div
          ref={canvasRef}
          data-canvas="true"
          className="relative overflow-hidden"
          style={{
            width: formSettings.width,
            height: formSettings.height,
            backgroundColor: formSettings.backColor,
            ...gridBg,
            cursor: dragState ? (dragState.type === 'move' ? 'grabbing' : 'default') : 'default',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onContextMenu={handleContextMenu}
        >
          {components
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((comp) => (
              <DesignComponent
                key={comp.id}
                component={comp}
                isSelected={selectedIds.includes(comp.id)}
                onMouseDown={handleComponentMouseDown}
                onDoubleClick={handleDoubleClick}
                onResizeStart={handleResizeStart}
              />
            ))}
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              componentId={contextMenu.componentId}
              onClose={() => setContextMenu(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
