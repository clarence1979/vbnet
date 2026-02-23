import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { VBInterpreter, parseHandlerCode } from '../../engine/interpreter';
import type { RuntimeComponent, RuntimeContext } from '../../engine/interpreter';
import { renderRuntimeComponent } from './runtimeRenderers';

interface Props {
  onClose: () => void;
}

interface RuntimeState {
  components: Map<string, { props: Record<string, unknown> }>;
  consoleOutput: string[];
  currentLine: string;
}

interface MessageBoxState {
  text: string;
  resolve: () => void;
}

interface InputBoxState {
  prompt: string;
  title: string;
  defaultValue: string;
  resolve: (value: string) => void;
}

interface ConsoleInputState {
  type: 'readline' | 'readkey';
  resolve: (value: string) => void;
}

export default function RuntimePreview({ onClose }: Props) {
  const formSettings = useProjectStore((s) => s.formSettings);
  const components = useProjectStore((s) => s.components);
  const eventHandlers = useProjectStore((s) => s.eventHandlers);
  const executionState = useProjectStore((s) => s.executionState);
  const files = useProjectStore((s) => s.files);
  const addFile = useProjectStore((s) => s.addFile);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);

  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    components: new Map(),
    consoleOutput: [],
    currentLine: '',
  });
  const [showConsole, setShowConsole] = useState(false);
  const [messageBox, setMessageBox] = useState<MessageBoxState | null>(null);
  const [inputBox, setInputBox] = useState<InputBoxState | null>(null);
  const [consoleInput, setConsoleInput] = useState<ConsoleInputState | null>(null);

  const interpreterRef = useRef<VBInterpreter | null>(null);
  const contextRef = useRef<RuntimeContext | null>(null);
  const timerRefs = useRef<Map<string, number>>(new Map());
  const inputBoxRef = useRef<HTMLInputElement>(null);
  const consoleInputRef = useRef<HTMLInputElement>(null);

  const initRuntime = useCallback(async () => {
    const runtimeComponents = new Map<string, RuntimeComponent>();

    for (const comp of components) {
      runtimeComponents.set(comp.name, {
        name: comp.name,
        type: comp.type,
        props: {
          text: comp.text,
          enabled: comp.enabled,
          visible: comp.visible,
          checked: comp.checked,
          backColor: comp.backColor,
          foreColor: comp.foreColor,
          left: comp.left,
          top: comp.top,
          width: comp.width,
          height: comp.height,
          items: comp.items ? [...comp.items] : undefined,
          selectedIndex: comp.selectedIndex,
          value: comp.value,
          maximum: comp.maximum,
          minimum: comp.minimum,
          imageUrl: comp.imageUrl,
          interval: comp.interval,
        },
      });
    }

    const ctx: RuntimeContext = {
      components: runtimeComponents,
      variables: new Map(),
      eventHandlers: new Map(),
      consoleOutput: [],
      onPropertyChange: (name, prop, value) => {
        setRuntimeState((prev) => {
          const newMap = new Map(prev.components);
          const existing = newMap.get(name);
          if (existing) {
            newMap.set(name, { props: { ...existing.props, [prop]: value } });
          }
          return { ...prev, components: newMap };
        });
      },
      onConsoleLog: (msg) => {
        setRuntimeState((prev) => {
          const newOutput = prev.currentLine
            ? [...prev.consoleOutput, prev.currentLine + msg]
            : [...prev.consoleOutput, msg];
          return {
            ...prev,
            consoleOutput: newOutput,
            currentLine: '',
          };
        });
        setShowConsole(true);
      },
      onConsoleWrite: (msg) => {
        setRuntimeState((prev) => ({
          ...prev,
          currentLine: prev.currentLine + msg,
        }));
        setShowConsole(true);
      },
      onError: (msg, line) => {
        const fullMsg = line ? `Error at line ${line}: ${msg}` : `Error: ${msg}`;
        setRuntimeState((prev) => ({
          ...prev,
          consoleOutput: [...prev.consoleOutput, fullMsg],
        }));
        setShowConsole(true);
      },
      onMessageBox: (msg) => {
        return new Promise<void>((resolve) => {
          setMessageBox({ text: msg, resolve });
        });
      },
      onInputBox: (prompt, title, defaultValue) => {
        return new Promise<string>((resolve) => {
          setInputBox({
            prompt,
            title: title ?? formSettings.text,
            defaultValue: defaultValue ?? '',
            resolve,
          });
        });
      },
      onConsoleReadLine: () => {
        setShowConsole(true);
        return new Promise<string>((resolve) => {
          setConsoleInput({ type: 'readline', resolve });
        });
      },
      onConsoleReadKey: () => {
        setShowConsole(true);
        return new Promise<string>((resolve) => {
          setConsoleInput({ type: 'readkey', resolve });
        });
      },
      onFileWriteAllText: (name, content, extension) => {
        const existingFile = files.find(f => f.name === name && f.fileType === extension);
        if (existingFile) {
          updateFileContent(existingFile.id, content);
        } else {
          const fileId = addFile(extension as any, name);
          setTimeout(() => {
            updateFileContent(fileId, content);
          }, 0);
        }
      },
      onFileReadAllText: (name, extension) => {
        const file = files.find(f => f.name === name && f.fileType === extension);
        return file?.code ?? '';
      },
      paused: false,
      stopped: false,
    };

    for (const handler of eventHandlers) {
      const key = `${handler.componentName}_${handler.eventName}`;
      try {
        const ast = parseHandlerCode(handler.code);
        ctx.eventHandlers.set(key, ast);
      } catch {
        ctx.consoleOutput.push(`Parse error in ${key}`);
      }
    }

    const compState = new Map<string, { props: Record<string, unknown> }>();
    runtimeComponents.forEach((c, name) => {
      compState.set(name, { props: { ...c.props } });
    });
    setRuntimeState({ components: compState, consoleOutput: [], currentLine: '' });

    contextRef.current = ctx;
    interpreterRef.current = new VBInterpreter(ctx);

    const loadKey = `${formSettings.name}_Load`;
    const mainKey = 'Main';

    if (ctx.eventHandlers.has(loadKey)) {
      const body = ctx.eventHandlers.get(loadKey)!;
      await interpreterRef.current.executeBlock(body);
    } else if (ctx.eventHandlers.has(mainKey)) {
      setShowConsole(true);
      const body = ctx.eventHandlers.get(mainKey)!;
      await interpreterRef.current.executeBlock(body);
    }

    for (const comp of components) {
      if (comp.type === 'Timer' && comp.enabled && comp.interval) {
        const tickKey = `${comp.name}_Tick`;
        if (ctx.eventHandlers.has(tickKey)) {
          const id = window.setInterval(() => {
            if (ctx.stopped) return;
            const body = ctx.eventHandlers.get(tickKey)!;
            interpreterRef.current?.executeBlock(body);
          }, comp.interval);
          timerRefs.current.set(comp.name, id);
        }
      }
    }
  }, [components, eventHandlers, formSettings.name, formSettings.text, files, addFile, updateFileContent]);

  useEffect(() => {
    if (executionState === 'running') {
      initRuntime();
    }
    return () => {
      if (contextRef.current) {
        contextRef.current.stopped = true;
      }
      timerRefs.current.forEach((id) => clearInterval(id));
      timerRefs.current.clear();
    };
  }, [executionState, initRuntime]);

  const handleEvent = useCallback(async (componentName: string, eventName: string) => {
    if (!interpreterRef.current || !contextRef.current) return;
    if (contextRef.current.stopped) return;

    if (eventName.startsWith('__set_text:')) {
      const val = eventName.substring('__set_text:'.length);
      const comp = contextRef.current.components.get(componentName);
      if (comp) {
        comp.props.text = val;
        contextRef.current.onPropertyChange(componentName, 'text', val);
      }
      return;
    }
    if (eventName.startsWith('__set_checked:')) {
      const val = eventName.substring('__set_checked:'.length) === 'true';
      const comp = contextRef.current.components.get(componentName);
      if (comp) {
        comp.props.checked = val;
        contextRef.current.onPropertyChange(componentName, 'checked', val);
      }
      return;
    }
    if (eventName.startsWith('__set_selectedIndex:')) {
      const val = parseInt(eventName.substring('__set_selectedIndex:'.length), 10);
      const comp = contextRef.current.components.get(componentName);
      if (comp) {
        comp.props.selectedIndex = val;
        contextRef.current.onPropertyChange(componentName, 'selectedIndex', val);
      }
      return;
    }
    if (eventName.startsWith('__set_value:')) {
      const val = parseFloat(eventName.substring('__set_value:'.length));
      const comp = contextRef.current.components.get(componentName);
      if (comp) {
        comp.props.value = val;
        contextRef.current.onPropertyChange(componentName, 'value', val);
      }
      return;
    }

    const key = `${componentName}_${eventName}`;
    if (contextRef.current.eventHandlers.has(key)) {
      const body = contextRef.current.eventHandlers.get(key)!;
      await interpreterRef.current.executeBlock(body);
    }
  }, []);

  const handleMessageBoxOk = useCallback(() => {
    if (!messageBox) return;
    const { resolve } = messageBox;
    setMessageBox(null);
    setTimeout(() => resolve(), 0);
  }, [messageBox]);

  const handleInputBoxSubmit = useCallback((value: string) => {
    if (!inputBox) return;
    const { resolve } = inputBox;
    setInputBox(null);
    setTimeout(() => resolve(value), 0);
  }, [inputBox]);

  const handleConsoleInput = useCallback((value: string) => {
    if (!consoleInput) return;
    const { resolve } = consoleInput;
    setRuntimeState((prev) => {
      const newOutput = prev.currentLine
        ? [...prev.consoleOutput, prev.currentLine + value]
        : [...prev.consoleOutput, value];
      return {
        ...prev,
        consoleOutput: newOutput,
        currentLine: '',
      };
    });
    setConsoleInput(null);
    setTimeout(() => resolve(value), 0);
  }, [consoleInput]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="flex flex-col bg-[#F0F0F0] rounded-lg shadow-2xl overflow-hidden" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
        <div className="bg-[#0078D4] h-8 flex items-center px-3 rounded-t-lg" style={{ width: formSettings.width }}>
          <span className="text-white text-xs font-medium">{formSettings.text} - Running</span>
          <div className="ml-auto flex items-center">
            <div className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 transition-colors cursor-default">
              <Minus size={12} className="text-white" />
            </div>
            <div className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 transition-colors cursor-default">
              <Square size={10} className="text-white" />
            </div>
            <button
              onClick={onClose}
              className="w-[46px] h-8 flex items-center justify-center hover:bg-[#E81123] rounded-tr-lg transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>

        <div
          className="relative"
          style={{
            width: formSettings.width,
            height: formSettings.height,
            backgroundColor: formSettings.backColor,
          }}
        >
          {components.map((comp) => {
            const rtState = runtimeState.components.get(comp.name);
            const runtimeProps = rtState ? rtState.props : {};
            return renderRuntimeComponent(comp, runtimeProps, handleEvent);
          })}
        </div>

        {showConsole && (
          <div className="border-t border-[#CCCEDB] bg-[#1E1E1E] max-h-48 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-2 py-1 border-b border-[#333] shrink-0">
              <span className="text-[10px] text-[#808080] uppercase tracking-wider">Console</span>
              {!consoleInput && (
                <button onClick={() => setShowConsole(false)} className="text-[#808080] hover:text-white">
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
              {runtimeState.consoleOutput.map((line, i) => (
                <div key={i} className="text-[11px] text-[#CCCCCC] font-mono whitespace-pre-wrap">{line}</div>
              ))}
              {runtimeState.currentLine && (
                <span className="text-[11px] text-[#CCCCCC] font-mono whitespace-pre-wrap">{runtimeState.currentLine}</span>
              )}
              {consoleInput && (
                <div className="mt-1">
                  <input
                    ref={consoleInputRef}
                    type="text"
                    autoFocus
                    className="bg-[#2D2D2D] text-[#CCCCCC] font-mono text-[11px] border border-[#555] px-1 py-0.5 focus:outline-none focus:border-[#0078D4] w-full"
                    placeholder={consoleInput.type === 'readkey' ? 'Press any key...' : 'Type and press Enter...'}
                    onKeyDown={(e) => {
                      if (consoleInput.type === 'readkey') {
                        e.preventDefault();
                        handleConsoleInput(e.key);
                      } else if (e.key === 'Enter') {
                        handleConsoleInput(consoleInputRef.current?.value ?? '');
                      }
                    }}
                  />
                </div>
              )}
              {runtimeState.consoleOutput.length === 0 && !runtimeState.currentLine && !consoleInput && (
                <div className="text-[11px] text-[#555]">No output</div>
              )}
            </div>
          </div>
        )}

        {!showConsole && (
          <button
            onClick={() => setShowConsole(true)}
            className="h-5 bg-[#333] text-[10px] text-[#808080] hover:text-white text-center transition-colors"
          >
            Show Console
          </button>
        )}

        {messageBox !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
            <div className="bg-white rounded shadow-xl border border-[#CCCCCC] min-w-[300px]">
              <div className="bg-[#F0F0F0] px-4 py-2 border-b border-[#CCCCCC]">
                <span className="text-xs font-medium">{formSettings.text}</span>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-[#1E1E1E]">{messageBox.text}</p>
              </div>
              <div className="px-4 py-3 border-t border-[#E0E0E0] flex justify-end">
                <button
                  onClick={handleMessageBoxOk}
                  className="px-6 py-1.5 text-xs bg-[#E1E1E1] border border-[#ADADAD] rounded hover:bg-[#D5D5D5] transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {inputBox !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
            <div className="bg-white rounded shadow-xl border border-[#CCCCCC] min-w-[340px]">
              <div className="bg-[#F0F0F0] px-4 py-2 border-b border-[#CCCCCC]">
                <span className="text-xs font-medium">{inputBox.title}</span>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-[#1E1E1E] mb-3">{inputBox.prompt}</p>
                <input
                  ref={inputBoxRef}
                  type="text"
                  defaultValue={inputBox.defaultValue}
                  autoFocus
                  className="w-full border border-[#7A7A7A] px-2 py-1.5 text-sm focus:outline-none focus:border-[#0078D4]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleInputBoxSubmit(inputBoxRef.current?.value ?? '');
                    }
                  }}
                />
              </div>
              <div className="px-4 py-3 border-t border-[#E0E0E0] flex justify-end gap-2">
                <button
                  onClick={() => handleInputBoxSubmit('')}
                  className="px-6 py-1.5 text-xs bg-[#E1E1E1] border border-[#ADADAD] rounded hover:bg-[#D5D5D5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleInputBoxSubmit(inputBoxRef.current?.value ?? '')}
                  className="px-6 py-1.5 text-xs bg-[#E1E1E1] border border-[#ADADAD] rounded hover:bg-[#D5D5D5] transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
