import {
  Play,
  Pause,
  Square,
  Hammer,
  FileCode2,
  Layout,
  Save,
  FolderOpen,
  FilePlus,
  Download,
  Grid3x3,
  Magnet,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import SessionPanel from '../Session/SessionPanel';
import logoImage from '../../../public/digivec_logo.png';

interface Props {
  onRun: () => void;
  onPause: () => void;
  onStop: () => void;
  onCompile: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNewProject: () => void;
  onExportCode: () => void;
  onShowExamples: () => void;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  variant,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.FC<any>;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'green' | 'yellow' | 'red' | 'blue';
}) {
  const variantClasses: Record<string, string> = {
    green: 'text-green-600 hover:bg-green-50',
    yellow: 'text-yellow-600 hover:bg-yellow-50',
    red: 'text-red-600 hover:bg-red-50',
    blue: 'text-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : active
          ? 'bg-[#C9DEF5] text-[#005FB8]'
          : variant
          ? variantClasses[variant]
          : 'text-[#444] hover:bg-[#E0E0E0]'
      }`}
    >
      <Icon size={14} />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-[#CCCEDB] mx-1" />;
}

export default function Toolbar({
  onRun,
  onPause,
  onStop,
  onCompile,
  onSave,
  onLoad,
  onNewProject,
  onExportCode,
  onShowExamples,
}: Props) {
  const viewMode = useProjectStore((s) => s.viewMode);
  const executionState = useProjectStore((s) => s.executionState);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const formSettings = useProjectStore((s) => s.formSettings);
  const setFormSettings = useProjectStore((s) => s.setFormSettings);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);

  return (
    <div className="h-10 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center px-3 gap-0.5">
      <a
        href="https://digitalvector.com.au"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center mr-2 shrink-0 hover:opacity-80 transition-opacity"
        title="Digital Vector"
      >
        <img
          src={logoImage}
          alt="Digital Vector"
          className="h-7 w-auto"
        />
      </a>

      <Separator />

      <ToolbarButton icon={FilePlus} label="New" onClick={onNewProject} />
      <ToolbarButton icon={FolderOpen} label="Open" onClick={onLoad} />
      <ToolbarButton icon={Save} label="Save" onClick={onSave} />

      <Separator />

      <ToolbarButton icon={Undo2} label="Undo" onClick={undo} />
      <ToolbarButton icon={Redo2} label="Redo" onClick={redo} />

      <Separator />

      <ToolbarButton
        icon={Layout}
        label="Design"
        onClick={() => setViewMode('design')}
        active={viewMode === 'design'}
      />
      <ToolbarButton
        icon={FileCode2}
        label="Code"
        onClick={() => setViewMode('code')}
        active={viewMode === 'code'}
      />

      <Separator />

      <ToolbarButton
        icon={Grid3x3}
        label="Grid"
        onClick={() => setFormSettings({ showGrid: !formSettings.showGrid })}
        active={formSettings.showGrid}
      />
      <ToolbarButton
        icon={Magnet}
        label="Snap"
        onClick={() => setFormSettings({ snapToGrid: !formSettings.snapToGrid })}
        active={formSettings.snapToGrid}
      />

      <Separator />

      <ToolbarButton
        icon={Play}
        label="Run"
        onClick={onRun}
        disabled={executionState === 'running'}
        variant="green"
      />
      <ToolbarButton
        icon={Pause}
        label="Pause"
        onClick={onPause}
        disabled={executionState !== 'running'}
        variant="yellow"
      />
      <ToolbarButton
        icon={Square}
        label="Stop"
        onClick={onStop}
        disabled={executionState === 'stopped'}
        variant="red"
      />

      <Separator />

      <ToolbarButton icon={Hammer} label="Build" onClick={onCompile} variant="blue" />
      <ToolbarButton icon={Download} label="Export Code" onClick={onExportCode} />

      <Separator />

      <SessionPanel />

      <div className="flex-1" />

      <button
        onClick={onShowExamples}
        className="text-xs text-[#0078D4] hover:underline px-2 py-1"
      >
        Examples
      </button>
    </div>
  );
}
