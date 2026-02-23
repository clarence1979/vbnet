import { useState, useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { getDefaultEvent } from '../../utils/eventDefinitions';

interface ContextMenuState {
  x: number;
  y: number;
  componentId: string;
  componentName: string;
  componentType: string;
}

export default function ComponentOutline() {
  const components = useProjectStore((s) => s.components);
  const selectedIds = useProjectStore((s) => s.selectedIds);
  const setSelectedIds = useProjectStore((s) => s.setSelectedIds);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const setCodeEditorTarget = useProjectStore((s) => s.setCodeEditorTarget);
  const eventHandlers = useProjectStore((s) => s.eventHandlers);
  const setEventHandler = useProjectStore((s) => s.setEventHandler);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, component: { id: string; name: string; type: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleHighlight = useCallback(() => {
    if (contextMenu) {
      setSelectedIds([contextMenu.componentId]);
      setViewMode('design');
      setContextMenu(null);
    }
  }, [contextMenu, setSelectedIds, setViewMode]);

  const handleGoToCode = useCallback(() => {
    if (contextMenu) {
      const defaultEvent = getDefaultEvent(contextMenu.componentType);
      const handler = eventHandlers.find(
        h => h.componentName === contextMenu.componentName && h.eventName === defaultEvent
      );

      if (!handler) {
        setEventHandler(
          contextMenu.componentName,
          defaultEvent,
          `' Add your code here for ${contextMenu.componentName}.${defaultEvent}`
        );
      }

      setCodeEditorTarget(`${contextMenu.componentName}:${defaultEvent}`);
      setViewMode('code');
      setContextMenu(null);
    }
  }, [contextMenu, eventHandlers, setEventHandler, setCodeEditorTarget, setViewMode]);

  const handleComponentClick = useCallback((componentId: string) => {
    setSelectedIds([componentId]);
  }, [setSelectedIds]);

  return (
    <>
      <div className="flex flex-col h-full bg-[#F5F5F5] overflow-hidden">
        <div className="px-2 py-1.5 bg-[#EEEEF2] border-b border-[#CCCEDB] shrink-0">
          <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide uppercase">Component Outline</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {components.length === 0 ? (
            <div className="px-3 py-4 text-[11px] text-[#999] text-center">
              No components on form
            </div>
          ) : (
            <div className="py-1">
              {components
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((comp) => (
                  <div
                    key={comp.id}
                    className={`px-3 py-1.5 text-[11px] cursor-pointer hover:bg-[#E8E8E8] transition-colors border-l-2 ${
                      selectedIds.includes(comp.id)
                        ? 'bg-[#CCE8FF] border-[#0078D4]'
                        : 'border-transparent'
                    }`}
                    onClick={() => handleComponentClick(comp.id)}
                    onContextMenu={(e) => handleContextMenu(e, comp)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1E1E1E]">{comp.name}</span>
                      <span className="text-[#666] text-[10px]">{comp.type}</span>
                    </div>
                    <div className="text-[10px] text-[#999] mt-0.5">
                      Position: {comp.left}, {comp.top} | Size: {comp.width} × {comp.height}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCloseContextMenu();
            }}
          />
          <div
            className="fixed z-50 bg-white border border-[#CCCEDB] shadow-lg min-w-[180px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={handleHighlight}
              className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#E8E8E8] transition-colors text-[#1E1E1E]"
            >
              Select in Designer
            </button>
            <button
              onClick={handleGoToCode}
              className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#E8E8E8] transition-colors text-[#1E1E1E] border-t border-[#E0E0E0]"
            >
              View Event Code
            </button>
          </div>
        </>
      )}
    </>
  );
}
