import { useMemo } from 'react';
import type { FormComponent } from '../../types/component.types';
import { renderComponentContent, isNonVisual } from './designRenderers';

interface Props {
  component: FormComponent;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: (id: string) => void;
  onResizeStart: (e: React.MouseEvent, id: string, handle: string) => void;
}

const HANDLE_SIZE = 7;
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function getHandleStyle(handle: string, w: number, h: number): React.CSSProperties {
  const half = HANDLE_SIZE / 2;
  const map: Record<string, React.CSSProperties> = {
    nw: { left: -half, top: -half, cursor: 'nw-resize' },
    n: { left: w / 2 - half, top: -half, cursor: 'n-resize' },
    ne: { left: w - half, top: -half, cursor: 'ne-resize' },
    e: { left: w - half, top: h / 2 - half, cursor: 'e-resize' },
    se: { left: w - half, top: h - half, cursor: 'se-resize' },
    s: { left: w / 2 - half, top: h - half, cursor: 's-resize' },
    sw: { left: -half, top: h - half, cursor: 'sw-resize' },
    w: { left: -half, top: h / 2 - half, cursor: 'w-resize' },
  };
  return map[handle];
}

export default function DesignComponent({ component, isSelected, onMouseDown, onDoubleClick, onResizeStart }: Props) {
  const style = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      left: component.left,
      top: component.top,
      width: component.width,
      height: component.height,
      zIndex: component.zIndex,
      opacity: component.visible === false && !isNonVisual(component.type) ? 0.4 : 1,
    }),
    [component.left, component.top, component.width, component.height, component.zIndex, component.visible, component.type]
  );

  return (
    <div
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, component.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(component.id);
      }}
      className="group"
    >
      {renderComponentContent(component)}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 border border-[#3399FF] transition-opacity duration-75" />
      {isSelected && (
        <>
          <div className="absolute inset-0 pointer-events-none border-2 border-[#005FB8]" />
          {HANDLES.map((h) => (
            <div
              key={h}
              className="absolute bg-white border border-[#005FB8] pointer-events-auto"
              style={{
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                ...getHandleStyle(h, component.width, component.height),
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, component.id, h);
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
