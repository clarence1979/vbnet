import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { Undo2, Redo2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { generateFullCode, getDefaultEventName, extractHandlerCode } from '../../engine/codeGenerator';
import { registerVBLanguage } from './vbLanguageConfig';

export default function VBCodeEditor() {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const pendingTargetRef = useRef<string | null>(null);
  const formSettings = useProjectStore((s) => s.formSettings);
  const components = useProjectStore((s) => s.components);
  const eventHandlers = useProjectStore((s) => s.eventHandlers);
  const codeEditorTarget = useProjectStore((s) => s.codeEditorTarget);
  const setEventHandler = useProjectStore((s) => s.setEventHandler);
  const setCodeEditorTarget = useProjectStore((s) => s.setCodeEditorTarget);
  const userCode = useProjectStore((s) => s.userCode);
  const setUserCode = useProjectStore((s) => s.setUserCode);
  const files = useProjectStore((s) => s.files);
  const activeFileId = useProjectStore((s) => s.activeFileId);

  const activeFile = files.find((f) => f.id === activeFileId);
  const isForm = activeFile?.fileType === 'form';
  const fileName = isForm ? formSettings.name : (activeFile?.name ?? 'Untitled');

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateUndoRedoState = useCallback(() => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCanUndo((model as any).canUndo?.() ?? true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCanRedo((model as any).canRedo?.() ?? true);
  }, []);

  const handleUndo = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.trigger('toolbar', 'undo', null);
    editorRef.current.focus();
  }, []);

  const handleRedo = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.trigger('toolbar', 'redo', null);
    editorRef.current.focus();
  }, []);

  const fullCode = useMemo(
    () => isForm ? generateFullCode(formSettings, components, eventHandlers) : '',
    [formSettings, components, eventHandlers, isForm]
  );

  const codeToShow = userCode || fullCode;

  useEffect(() => {
    if (isForm && !userCode) {
      setUserCode(fullCode);
    }
  }, [activeFileId]);

  const jumpToHandler = useCallback((target: string) => {
    if (!editorRef.current) {
      pendingTargetRef.current = target;
      return;
    }
    const model = editorRef.current.getModel();
    if (!model) return;

    let componentName: string;
    let eventName: string;

    if (target.includes(':')) {
      [componentName, eventName] = target.split(':');
    } else {
      componentName = target;
      if (componentName === formSettings.name) {
        eventName = 'Load';
      } else {
        const comp = components.find((c) => c.name === componentName);
        if (!comp) return;
        eventName = getDefaultEventName(comp.type);
      }
    }

    const searchText = `Private Sub ${componentName}_${eventName}`;
    const matches = model.findMatches(searchText, false, false, false, null, false);
    if (matches.length > 0) {
      const range = matches[0].range;
      const bodyLine = range.startLineNumber + 1;
      editorRef.current.revealLineInCenter(bodyLine);
      editorRef.current.setPosition({ lineNumber: bodyLine, column: 9 });
      editorRef.current.focus();
    }
  }, [components, formSettings.name]);

  useEffect(() => {
    if (codeEditorTarget) {
      jumpToHandler(codeEditorTarget);
      setCodeEditorTarget(null);
    }
  }, [codeEditorTarget, jumpToHandler, setCodeEditorTarget]);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    registerVBLanguage(monaco, components);
  }, [components]);

  useEffect(() => {
    if (editorRef.current) {
      const monaco = (window as any).monaco;
      if (monaco) {
        registerVBLanguage(monaco, components);
      }
    }
  }, [components]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    editor.addAction({
      id: 'editor.action.clipboardPasteAction',
      label: 'Paste',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 3,
      run: async (ed) => {
        try {
          const text = await navigator.clipboard.readText();
          const pos = ed.getPosition();
          const model = ed.getModel();
          const lines = text.split(/\r?\n/);

          if (lines.length > 1 && pos && model) {
            const curLineContent = model.getLineContent(pos.lineNumber);
            const lineIndent = curLineContent.match(/^(\s*)/)?.[1] ?? '';
            const firstLineIndent = lines[0].match(/^(\s*)/)?.[1] ?? '';

            const adjusted = lines.map((line, i) => {
              if (i === 0) return line;
              if (line.trim() === '') return '';
              if (line.startsWith(firstLineIndent)) {
                return lineIndent + line.substring(firstLineIndent.length);
              }
              return lineIndent + line;
            });
            ed.trigger('clipboard', 'type', { text: adjusted.join('\n') });
          } else {
            ed.trigger('clipboard', 'type', { text });
          }
        } catch {
          document.execCommand('paste');
        }
      },
    });

    editor.addAction({
      id: 'editor.action.clipboardCopyAction',
      label: 'Copy',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 1,
      run: async (ed) => {
        const selection = ed.getSelection();
        if (selection) {
          const text = ed.getModel()?.getValueInRange(selection) || '';
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            // ignore
          }
        }
      },
    });

    editor.addAction({
      id: 'editor.action.clipboardCutAction',
      label: 'Cut',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX],
      contextMenuGroupId: '9_cutcopypaste',
      contextMenuOrder: 2,
      run: async (ed) => {
        const selection = ed.getSelection();
        if (selection) {
          const text = ed.getModel()?.getValueInRange(selection) || '';
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            // ignore
          }
          ed.executeEdits('cut', [{
            range: selection,
            text: '',
          }]);
        }
      },
    });

    const model = editor.getModel();
    if (model) {
      model.onDidChangeContent(() => updateUndoRedoState());
      updateUndoRedoState();
    }

    if (pendingTargetRef.current) {
      const target = pendingTargetRef.current;
      pendingTargetRef.current = null;
      setTimeout(() => jumpToHandler(target), 100);
    }
  }, [jumpToHandler, updateUndoRedoState]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      setUserCode(value);

      if (isForm) {
        for (const handler of eventHandlers) {
          const code = extractHandlerCode(value, handler.componentName, handler.eventName);
          if (code && code !== "' TODO: Add your code here" && code.trim() !== '') {
            setEventHandler(handler.componentName, handler.eventName, code);
          }
        }

        for (const comp of components) {
          const defaultEvent = getDefaultEventName(comp.type);
          const code = extractHandlerCode(value, comp.name, defaultEvent);
          if (code && code !== "' TODO: Add your code here" && code.trim() !== '') {
            setEventHandler(comp.name, defaultEvent, code);
          }
        }
      }
    },
    [components, eventHandlers, setEventHandler, setUserCode, isForm]
  );

  const handleRegenerateCode = useCallback(() => {
    const newCode = generateFullCode(formSettings, components, eventHandlers);
    setUserCode(newCode);
  }, [formSettings, components, eventHandlers, setUserCode]);

  return (
    <div className="flex-1 flex flex-col bg-[#1E1E1E]">
      <div className="h-8 bg-[#252526] border-b border-[#3C3C3C] flex items-center px-3 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#CCCCCC]">
            {fileName}.vb
          </span>
          {isForm && codeEditorTarget && (
            <span className="text-[10px] text-[#808080]">
              {'→'} {codeEditorTarget}_{components.find(c => c.name === codeEditorTarget) ? getDefaultEventName(components.find(c => c.name === codeEditorTarget)!.type) : ''}
            </span>
          )}
          {!isForm && activeFile && (
            <span className="text-[10px] text-[#808080] capitalize">
              {activeFile.fileType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1 rounded hover:bg-[#333333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={14} className="text-[#CCCCCC]" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1 rounded hover:bg-[#333333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 size={14} className="text-[#CCCCCC]" />
          </button>
          {isForm && (
            <>
              <div className="w-px h-4 bg-[#3C3C3C] mx-1" />
              <button
                onClick={handleRegenerateCode}
                className="text-[10px] text-[#0078D4] hover:text-[#3399FF] px-2 py-0.5 rounded hover:bg-[#333333] transition-colors"
              >
                Regenerate Code
              </button>
            </>
          )}
        </div>
      </div>
      <Editor
        key={activeFileId}
        height="100%"
        language="vb"
        theme="vs-dark"
        value={codeToShow}
        onChange={handleCodeChange}
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        options={{
          fontSize: 13,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          padding: { top: 8 },
          contextmenu: true,
        }}
      />
    </div>
  );
}
