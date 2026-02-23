import { useCallback, useEffect, useRef, useState } from 'react';
import { useProjectStore } from './store/useProjectStore';
import Toolbar from './components/Toolbar/Toolbar';
import ComponentPalette from './components/Designer/ComponentPalette';
import Canvas from './components/Designer/Canvas';
import PropertyPanel from './components/Designer/PropertyPanel';
import StatusBar from './components/Designer/StatusBar';
import VBCodeEditor from './components/CodeEditor/VBCodeEditor';
import CSVEditor from './components/CodeEditor/CSVEditor';
import RuntimePreview from './components/Preview/RuntimePreview';
import Exporter from './components/Compiler/Exporter';
import ExampleGallery from './components/Toolbar/TemplateGallery';
import FileExplorer from './components/FileExplorer/FileExplorer';
import ComponentOutline from './components/Designer/ComponentOutline';
import CollapsibleSidebar from './components/Layout/CollapsibleSidebar';
import ResizableDivider from './components/Layout/ResizableDivider';
import { generateFullCode } from './engine/codeGenerator';
import {
  autoSaveProject,
  loadAutoSave,
  savedProjectHasContent,
  normalizeProject,
  exportProjectJSON,
  downloadText,
  readFileAsText,
} from './utils/persistence';
import type { ProjectExample } from './utils/templates';

export default function App() {
  const store = useProjectStore();
  const [showExporter, setShowExporter] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(256);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const activeFile = store.files.find((f) => f.id === store.activeFileId);
  const isFormActive = activeFile?.fileType === 'form';
  const isCSVActive = activeFile?.fileType === 'csv';

  useEffect(() => {
    const saved = loadAutoSave();
    if (saved && savedProjectHasContent(saved)) {
      setShowRestore(true);
    }
  }, []);

  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setInterval(() => {
      autoSaveProject(store.getProjectSnapshot());
    }, 30000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [store.formSettings, store.components, store.eventHandlers, store.userCode, store.files, store.activeFileId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && store.selectedIds.length > 0 && store.viewMode === 'design') {
        e.preventDefault();
        store.removeComponents(store.selectedIds);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && store.viewMode === 'design') {
        store.copySelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && store.viewMode === 'design') {
        store.pasteClipboard();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        store.redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        store.clearSelection();
      }
      if (e.key === 'F5' && !e.shiftKey) {
        e.preventDefault();
        handleRun();
      }
      if (e.key === 'F5' && e.shiftKey) {
        e.preventDefault();
        handleStop();
      }
      if (e.key === 'F7') {
        e.preventDefault();
        store.setViewMode('code');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  const handleRun = useCallback(() => {
    const code = generateFullCode(store.formSettings, store.components, store.eventHandlers);
    if (!store.userCode) store.setUserCode(code);
    store.setExecutionState('running');
  }, [store]);

  const handlePause = useCallback(() => {
    store.setExecutionState('paused');
  }, [store]);

  const handleStop = useCallback(() => {
    store.setExecutionState('stopped');
  }, [store]);

  const handleSave = useCallback(() => {
    const snapshot = store.getProjectSnapshot();
    const projectName = snapshot.find((f) => f.fileType === 'form')?.name ?? 'MyProject';
    const json = exportProjectJSON(snapshot);
    downloadText(json, `${projectName}.vbnet-project.json`);
  }, [store]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await readFileAsText(file);
        const data = JSON.parse(text);
        const normalized = normalizeProject(data);
        if (normalized.files.length > 0) {
          store.loadProject(normalized);
        } else {
          store.loadProject(data);
        }
      } catch {
        alert('Failed to load project file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [store]
  );

  const handleNewProject = useCallback(() => {
    const hasContent = store.files.some(
      (f) => (f.fileType === 'form' && store.components.length > 0) || f.code?.trim()
    );
    if (hasContent && !confirm('Start a new project? Unsaved changes will be lost.')) {
      return;
    }
    store.resetProject();
  }, [store]);

  const handleExportCode = useCallback(() => {
    const code = generateFullCode(store.formSettings, store.components, store.eventHandlers);
    downloadText(code, `${store.formSettings.name}.vb`, 'text/plain');
  }, [store]);

  const handleExampleSelect = useCallback(
    (example: ProjectExample) => {
      store.loadProject({
        formSettings: example.formSettings,
        components: example.components,
        eventHandlers: example.eventHandlers,
        userCode: '',
      });
      setShowExamples(false);
    },
    [store]
  );

  const handleRestore = useCallback(() => {
    const saved = loadAutoSave();
    if (saved) {
      const normalized = normalizeProject(saved);
      if (normalized.files.length > 0) {
        store.loadProject(normalized);
      } else {
        store.loadProject(saved);
      }
    }
    setShowRestore(false);
  }, [store]);

  const handleDragStart = useCallback(() => {}, []);

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5] overflow-hidden select-none">
      <Toolbar
        onRun={handleRun}
        onPause={handlePause}
        onStop={handleStop}
        onCompile={() => setShowExporter(true)}
        onSave={handleSave}
        onLoad={handleLoad}
        onNewProject={handleNewProject}
        onExportCode={handleExportCode}
        onShowExamples={() => setShowExamples(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {!leftCollapsed && (
          <>
            <div style={{ width: `${leftWidth}px` }} className="flex flex-col overflow-hidden bg-[#F5F5F5] border-r border-[#CCCEDB]">
              <FileExplorer />
              {store.viewMode === 'design' && isFormActive && (
                <>
                  <div className={`${outlineCollapsed ? 'flex-1' : 'flex-1'} overflow-hidden min-h-0`}>
                    <ComponentPalette onDragStart={handleDragStart} />
                  </div>
                  {!outlineCollapsed && (
                    <>
                      <div className="relative border-t border-[#CCCEDB]">
                        <button
                          onClick={() => setOutlineCollapsed(true)}
                          className="absolute top-1 right-1 z-10 bg-[#EEEEF2] border border-[#CCCEDB] rounded px-1.5 py-0.5 hover:bg-[#E0E0E0] transition-colors"
                          title="Hide Component Outline"
                        >
                          <div className="text-[#444] text-[10px] rotate-90">▶</div>
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden min-h-0">
                        <ComponentOutline />
                      </div>
                    </>
                  )}
                  {outlineCollapsed && (
                    <div className="border-t border-[#CCCEDB] bg-[#EEEEF2] relative">
                      <button
                        onClick={() => setOutlineCollapsed(false)}
                        className="w-full px-2 py-1.5 text-left text-[10px] font-semibold text-[#1E1E1E] hover:bg-[#E0E0E0] transition-colors tracking-wide uppercase flex items-center justify-between"
                        title="Show Component Outline"
                      >
                        <span>Component Outline</span>
                        <div className="text-[#444] text-[10px] -rotate-90">▶</div>
                      </button>
                    </div>
                  )}
                </>
              )}
              {(!isFormActive || store.viewMode !== 'design') && (
                <div className="flex-1" />
              )}
            </div>
            <ResizableDivider
              direction="vertical"
              onResize={(delta) => setLeftWidth(Math.max(150, Math.min(600, leftWidth + delta)))}
            />
          </>
        )}

        <button
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="absolute top-12 left-0 z-10 bg-[#EEEEF2] border border-[#CCCEDB] rounded-r px-1 py-2 hover:bg-[#E0E0E0] transition-colors"
          title={leftCollapsed ? 'Show Left Pane' : 'Hide Left Pane'}
        >
          <div className={`text-[#444] text-xs ${leftCollapsed ? '' : 'rotate-180'}`}>▶</div>
        </button>

        <div className="flex-1 flex overflow-hidden">
          {store.viewMode === 'design' && isFormActive ? (
            <>
              <Canvas />
              {!rightCollapsed && (
                <>
                  <ResizableDivider
                    direction="vertical"
                    onResize={(delta) => setRightWidth(Math.max(150, Math.min(600, rightWidth - delta)))}
                  />
                  <div style={{ width: `${rightWidth}px` }} className="flex flex-col overflow-hidden bg-[#F5F5F5] border-l border-[#CCCEDB]">
                    <PropertyPanel />
                  </div>
                </>
              )}
              <button
                onClick={() => setRightCollapsed(!rightCollapsed)}
                className="absolute top-12 right-0 z-10 bg-[#EEEEF2] border border-[#CCCEDB] rounded-l px-1 py-2 hover:bg-[#E0E0E0] transition-colors"
                title={rightCollapsed ? 'Show Right Pane' : 'Hide Right Pane'}
              >
                <div className={`text-[#444] text-xs ${rightCollapsed ? 'rotate-180' : ''}`}>▶</div>
              </button>
            </>
          ) : isCSVActive ? (
            <CSVEditor />
          ) : (
            <VBCodeEditor />
          )}
        </div>
      </div>

      <StatusBar />

      {store.executionState === 'running' && (
        <RuntimePreview onClose={handleStop} />
      )}

      {showExporter && <Exporter onClose={() => setShowExporter(false)} />}
      {showExamples && (
        <ExampleGallery
          onSelect={handleExampleSelect}
          onClose={() => setShowExamples(false)}
        />
      )}

      {showRestore && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="bg-[#0078D4] px-4 py-3">
              <span className="text-white text-sm font-medium">Restore Previous Session</span>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#444] mb-4">
                A previous session was found. Would you like to restore it?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowRestore(false)}
                  className="px-4 py-1.5 text-xs bg-[#F0F0F0] border border-[#CCCCCC] rounded hover:bg-[#E0E0E0] transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleRestore}
                  className="px-4 py-1.5 text-xs bg-[#0078D4] text-white rounded hover:bg-[#006CBE] transition-colors"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
