import { useProjectStore } from '../../store/useProjectStore';

export default function StatusBar() {
  const components = useProjectStore((s) => s.components);
  const selectedIds = useProjectStore((s) => s.selectedIds);
  const formSettings = useProjectStore((s) => s.formSettings);
  const executionState = useProjectStore((s) => s.executionState);

  const selected = selectedIds.length === 1
    ? components.find((c) => c.id === selectedIds[0])
    : null;

  return (
    <div className="h-6 bg-[#007ACC] flex items-center px-3 text-white text-[11px] gap-4">
      <span>
        Components: {components.length}
      </span>
      <span>
        Canvas: {formSettings.width} x {formSettings.height}
      </span>
      {selected && (
        <span>
          Selected: {selected.name} ({selected.left}, {selected.top}) {selected.width}x{selected.height}
        </span>
      )}
      {selectedIds.length > 1 && (
        <span>{selectedIds.length} items selected</span>
      )}
      <div className="flex-1" />
      <span className={executionState === 'running' ? 'text-green-300' : executionState === 'paused' ? 'text-yellow-300' : 'text-white/70'}>
        {executionState === 'running' ? 'Running' : executionState === 'paused' ? 'Paused' : 'Ready'}
      </span>
    </div>
  );
}
