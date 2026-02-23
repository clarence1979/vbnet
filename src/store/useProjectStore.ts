import { create } from 'zustand';
import type {
  FormComponent,
  FormSettings,
  EventHandler,
  ViewMode,
  ExecutionState,
  HistoryEntry,
  ComponentType,
  ProjectFile,
  ProjectFileType,
} from '../types/component.types';
import { DEFAULT_FORM_SETTINGS, createDefaultComponent, snapToGrid } from '../utils/defaults';
import { generateId } from '../utils/idGenerator';

function createFormFile(name: string): ProjectFile {
  return {
    id: generateId(),
    name,
    fileType: 'form',
    formSettings: { ...DEFAULT_FORM_SETTINGS, name, text: name },
    components: [],
    eventHandlers: [],
    code: '',
  };
}

function createCodeFile(name: string, fileType: 'module' | 'class' | 'csv'): ProjectFile {
  if (fileType === 'csv') {
    return {
      id: generateId(),
      name,
      fileType: 'csv',
      code: '',
    };
  }
  const keyword = fileType === 'module' ? 'Module' : 'Public Class';
  const endKeyword = fileType === 'module' ? 'End Module' : 'End Class';
  return {
    id: generateId(),
    name,
    fileType,
    code: `${keyword} ${name}\n\n${endKeyword}\n`,
  };
}

function getUniqueName(existing: string[], prefix: string): string {
  let idx = 1;
  let name = `${prefix}${idx}`;
  while (existing.includes(name)) {
    idx++;
    name = `${prefix}${idx}`;
  }
  return name;
}

const initialFile = createFormFile('Form1');

interface ProjectStore {
  files: ProjectFile[];
  activeFileId: string;

  formSettings: FormSettings;
  components: FormComponent[];
  selectedIds: string[];
  eventHandlers: EventHandler[];
  userCode: string;
  viewMode: ViewMode;
  executionState: ExecutionState;
  history: HistoryEntry[];
  historyIndex: number;
  clipboard: FormComponent[];
  nextZIndex: number;
  codeEditorTarget: string | null;

  addFile: (fileType: ProjectFileType, name?: string, parentId?: string) => string;
  removeFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  setActiveFile: (id: string) => void;
  getProjectSnapshot: () => ProjectFile[];
  toggleFolder: (id: string) => void;
  moveFile: (fileId: string, targetFolderId: string | null) => void;
  updateFileContent: (id: string, content: string) => void;

  setFormSettings: (settings: Partial<FormSettings>) => void;
  addComponent: (type: ComponentType, x: number, y: number) => void;
  updateComponent: (id: string, updates: Partial<FormComponent>) => void;
  removeComponents: (ids: string[]) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setExecutionState: (state: ExecutionState) => void;
  setUserCode: (code: string) => void;
  setEventHandler: (componentName: string, eventName: string, code: string) => void;
  getEventHandler: (componentName: string, eventName: string) => string;
  copySelected: () => void;
  pasteClipboard: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  setCodeEditorTarget: (target: string | null) => void;
  loadProject: (data: {
    formSettings?: FormSettings;
    components?: FormComponent[];
    eventHandlers?: EventHandler[];
    userCode?: string;
    files?: ProjectFile[];
  }) => void;
  resetProject: () => void;
}

const MAX_HISTORY = 50;

function syncActiveToFiles(state: ProjectStore): ProjectFile[] {
  return state.files.map((f) => {
    if (f.id !== state.activeFileId) return f;
    if (f.fileType === 'form') {
      return {
        ...f,
        formSettings: { ...state.formSettings },
        components: state.components.map((c) => ({ ...c, font: { ...c.font } })),
        eventHandlers: [...state.eventHandlers],
        code: state.userCode,
      };
    }
    return { ...f, code: state.userCode };
  });
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  files: [initialFile],
  activeFileId: initialFile.id,

  formSettings: { ...initialFile.formSettings! },
  components: [],
  selectedIds: [],
  eventHandlers: [],
  userCode: '',
  viewMode: 'design',
  executionState: 'stopped',
  history: [],
  historyIndex: -1,
  clipboard: [],
  nextZIndex: 1,
  codeEditorTarget: null,

  addFile: (fileType, name, parentId) => {
    const state = get();
    const existingNames = state.files.map((f) => f.name);
    const prefix = fileType === 'form' ? 'Form' : fileType === 'module' ? 'Module' : fileType === 'class' ? 'Class' : fileType === 'csv' ? 'Data' : 'Folder';
    const fileName = name || getUniqueName(existingNames, prefix);

    let newFile: ProjectFile;
    if (fileType === 'folder') {
      newFile = {
        id: generateId(),
        name: fileName,
        fileType: 'folder',
        code: '',
        parentId,
        children: [],
        isExpanded: true,
      };
    } else {
      newFile = fileType === 'form' ? createFormFile(fileName) : createCodeFile(fileName, fileType as 'module' | 'class' | 'csv');
      if (parentId) {
        newFile.parentId = parentId;
      }
    }

    const updatedFiles = syncActiveToFiles(state);

    // Update parent folder's children if applicable
    const filesWithParent = parentId
      ? updatedFiles.map((f) =>
          f.id === parentId && f.fileType === 'folder'
            ? { ...f, children: [...(f.children || []), newFile.id] }
            : f
        )
      : updatedFiles;

    set({ files: [...filesWithParent, newFile] });
    return newFile.id;
  },

  updateFileContent: (id, content) => {
    const state = get();
    const updatedFiles = state.files.map((f) =>
      f.id === id ? { ...f, code: content } : f
    );

    if (id === state.activeFileId) {
      set({ files: updatedFiles, userCode: content });
    } else {
      set({ files: updatedFiles });
    }
  },

  removeFile: (id) => {
    const state = get();
    const target = state.files.find((f) => f.id === id);
    if (!target) return;

    const formCount = state.files.filter((f) => f.fileType === 'form').length;
    if (target.fileType === 'form' && formCount <= 1) return;

    // Collect all IDs to remove (folder and its descendants)
    const idsToRemove = new Set<string>([id]);
    if (target.fileType === 'folder') {
      const collectDescendants = (folderId: string) => {
        const folder = state.files.find((f) => f.id === folderId);
        if (folder?.children) {
          folder.children.forEach((childId) => {
            idsToRemove.add(childId);
            const child = state.files.find((f) => f.id === childId);
            if (child?.fileType === 'folder') {
              collectDescendants(childId);
            }
          });
        }
      };
      collectDescendants(id);
    }

    // Remove from parent's children list
    const updatedFiles = syncActiveToFiles(state)
      .filter((f) => !idsToRemove.has(f.id))
      .map((f) => {
        if (f.fileType === 'folder' && f.children?.includes(id)) {
          return { ...f, children: f.children.filter((cid) => cid !== id) };
        }
        return f;
      });

    if (idsToRemove.has(state.activeFileId)) {
      const next = updatedFiles.find((f) => f.fileType !== 'folder') || updatedFiles[0];
      if (!next) {
        // No files left, create a new form
        const freshFile = createFormFile('Form1');
        set({
          files: [freshFile],
          activeFileId: freshFile.id,
          formSettings: { ...freshFile.formSettings! },
          components: [],
          selectedIds: [],
          eventHandlers: [],
          userCode: '',
          viewMode: 'design',
          history: [],
          historyIndex: -1,
          nextZIndex: 1,
        });
        return;
      }
      const isForm = next.fileType === 'form';
      set({
        files: updatedFiles,
        activeFileId: next.id,
        formSettings: isForm ? { ...next.formSettings! } : state.formSettings,
        components: isForm ? (next.components ?? []) : [],
        eventHandlers: isForm ? (next.eventHandlers ?? []) : [],
        userCode: next.code,
        viewMode: isForm ? 'design' : 'code',
        selectedIds: [],
        history: [],
        historyIndex: -1,
        nextZIndex: isForm
          ? Math.max(...(next.components ?? []).map((c) => c.zIndex), 0) + 1
          : 1,
      });
    } else {
      set({ files: updatedFiles });
    }
  },

  renameFile: (id, newName) => {
    const state = get();
    if (state.files.some((f) => f.id !== id && f.name === newName)) return;
    const updatedFiles = syncActiveToFiles(state).map((f) => {
      if (f.id !== id) return f;
      const updated = { ...f, name: newName };
      if (f.fileType === 'form' && f.formSettings) {
        updated.formSettings = { ...f.formSettings, name: newName, text: newName };
      }
      return updated;
    });
    const extra: Partial<ProjectStore> = {};
    if (id === state.activeFileId) {
      const file = state.files.find((f) => f.id === id);
      if (file?.fileType === 'form') {
        extra.formSettings = { ...state.formSettings, name: newName, text: newName };
      }
    }
    set({ files: updatedFiles, ...extra });
  },

  setActiveFile: (id) => {
    const state = get();
    if (id === state.activeFileId) return;
    const updatedFiles = syncActiveToFiles(state);
    const target = updatedFiles.find((f) => f.id === id);
    if (!target || target.fileType === 'folder') return;
    const isForm = target.fileType === 'form';
    set({
      files: updatedFiles,
      activeFileId: id,
      formSettings: isForm ? { ...target.formSettings! } : state.formSettings,
      components: isForm ? (target.components ?? []) : [],
      eventHandlers: isForm ? (target.eventHandlers ?? []) : [],
      userCode: target.code,
      viewMode: isForm ? 'design' : 'code',
      selectedIds: [],
      history: [],
      historyIndex: -1,
      nextZIndex: isForm
        ? Math.max(...(target.components ?? []).map((c) => c.zIndex), 0) + 1
        : 1,
    });
  },

  getProjectSnapshot: () => {
    return syncActiveToFiles(get());
  },

  toggleFolder: (id) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id && f.fileType === 'folder'
          ? { ...f, isExpanded: !f.isExpanded }
          : f
      ),
    }));
  },

  moveFile: (fileId, targetFolderId) => {
    const state = get();
    const file = state.files.find((f) => f.id === fileId);
    if (!file) return;

    // Can't move a folder into itself or its descendants
    if (file.fileType === 'folder' && targetFolderId) {
      let current = state.files.find((f) => f.id === targetFolderId);
      while (current) {
        if (current.id === fileId) return;
        current = current.parentId
          ? state.files.find((f) => f.id === current!.parentId)
          : undefined;
      }
    }

    const updatedFiles = syncActiveToFiles(state).map((f) => {
      // Remove from old parent's children
      if (f.fileType === 'folder' && f.children?.includes(fileId)) {
        return { ...f, children: f.children.filter((cid) => cid !== fileId) };
      }
      // Add to new parent's children
      if (targetFolderId && f.id === targetFolderId && f.fileType === 'folder') {
        return { ...f, children: [...(f.children || []), fileId] };
      }
      // Update the file's parentId
      if (f.id === fileId) {
        return { ...f, parentId: targetFolderId || undefined };
      }
      return f;
    });

    set({ files: updatedFiles });
  },

  setFormSettings: (settings) => {
    get().pushHistory();
    set((s) => {
      const newSettings = { ...s.formSettings, ...settings };
      const files = settings.name
        ? s.files.map((f) =>
            f.id === s.activeFileId ? { ...f, name: settings.name! } : f
          )
        : s.files;
      return { formSettings: newSettings, files };
    });
  },

  addComponent: (type, x, y) => {
    const state = get();
    state.pushHistory();
    const snappedX = state.formSettings.snapToGrid
      ? snapToGrid(x, state.formSettings.gridSize)
      : x;
    const snappedY = state.formSettings.snapToGrid
      ? snapToGrid(y, state.formSettings.gridSize)
      : y;
    const existingNames = state.components.map((c) => c.name);
    const comp = createDefaultComponent(type, snappedX, snappedY, existingNames, state.nextZIndex);
    set((s) => ({
      components: [...s.components, comp],
      selectedIds: [comp.id],
      nextZIndex: s.nextZIndex + 1,
    }));
  },

  updateComponent: (id, updates) => {
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  removeComponents: (ids) => {
    get().pushHistory();
    set((s) => ({
      components: s.components.filter((c) => !ids.includes(c.id)),
      selectedIds: s.selectedIds.filter((id) => !ids.includes(id)),
    }));
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelectedId: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),

  setViewMode: (mode) => set({ viewMode: mode }),
  setExecutionState: (state) => set({ executionState: state }),
  setUserCode: (code) => set({ userCode: code }),

  setEventHandler: (componentName, eventName, code) => {
    set((s) => {
      const existing = s.eventHandlers.findIndex(
        (h) => h.componentName === componentName && h.eventName === eventName
      );
      if (existing >= 0) {
        const updated = [...s.eventHandlers];
        updated[existing] = { componentName, eventName, code };
        return { eventHandlers: updated };
      }
      return { eventHandlers: [...s.eventHandlers, { componentName, eventName, code }] };
    });
  },

  getEventHandler: (componentName, eventName) => {
    const handler = get().eventHandlers.find(
      (h) => h.componentName === componentName && h.eventName === eventName
    );
    return handler?.code ?? '';
  },

  copySelected: () => {
    const state = get();
    const selected = state.components.filter((c) => state.selectedIds.includes(c.id));
    set({ clipboard: selected.map((c) => ({ ...c })) });
  },

  pasteClipboard: () => {
    const state = get();
    if (state.clipboard.length === 0) return;
    state.pushHistory();
    const existingNames = state.components.map((c) => c.name);
    let zIndex = state.nextZIndex;
    const newComps = state.clipboard.map((c) => {
      let name = c.name;
      let idx = 1;
      while (existingNames.includes(name)) {
        name = `${c.type}${idx}`;
        idx++;
      }
      existingNames.push(name);
      const newComp: FormComponent = {
        ...c,
        id: `comp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name,
        left: c.left + 20,
        top: c.top + 20,
        zIndex: zIndex++,
      };
      return newComp;
    });
    set((s) => ({
      components: [...s.components, ...newComps],
      selectedIds: newComps.map((c) => c.id),
      nextZIndex: zIndex,
    }));
  },

  pushHistory: () => {
    set((s) => {
      const entry: HistoryEntry = {
        components: s.components.map((c) => ({ ...c, font: { ...c.font } })),
        formSettings: { ...s.formSettings },
      };
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return { history: newHistory, historyIndex: newHistory.length - 1 };
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex < 0) return;
    const entry = state.history[state.historyIndex];
    set({
      components: entry.components.map((c) => ({ ...c, font: { ...c.font } })),
      formSettings: { ...entry.formSettings },
      historyIndex: state.historyIndex - 1,
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const entry = state.history[state.historyIndex + 1];
    set({
      components: entry.components.map((c) => ({ ...c, font: { ...c.font } })),
      formSettings: { ...entry.formSettings },
      historyIndex: state.historyIndex + 1,
    });
  },

  bringToFront: (id) => {
    set((s) => {
      const maxZ = Math.max(...s.components.map((c) => c.zIndex), 0);
      return {
        components: s.components.map((c) => (c.id === id ? { ...c, zIndex: maxZ + 1 } : c)),
        nextZIndex: maxZ + 2,
      };
    });
  },

  sendToBack: (id) => {
    set((s) => {
      const minZ = Math.min(...s.components.map((c) => c.zIndex), 0);
      return {
        components: s.components.map((c) => (c.id === id ? { ...c, zIndex: minZ - 1 } : c)),
      };
    });
  },

  setCodeEditorTarget: (target) => set({ codeEditorTarget: target }),

  loadProject: (data) => {
    if (data.files && data.files.length > 0) {
      const firstForm = data.files.find((f) => f.fileType === 'form') || data.files[0];
      const isForm = firstForm.fileType === 'form';
      set({
        files: data.files,
        activeFileId: firstForm.id,
        formSettings: isForm ? { ...firstForm.formSettings! } : { ...DEFAULT_FORM_SETTINGS },
        components: isForm ? (firstForm.components ?? []) : [],
        eventHandlers: isForm ? (firstForm.eventHandlers ?? []) : [],
        userCode: firstForm.code,
        viewMode: isForm ? 'design' : 'code',
        selectedIds: [],
        history: [],
        historyIndex: -1,
        nextZIndex: isForm
          ? Math.max(...(firstForm.components ?? []).map((c) => c.zIndex), 0) + 1
          : 1,
      });
    } else if (data.formSettings && data.components) {
      const file: ProjectFile = {
        id: generateId(),
        name: data.formSettings.name,
        fileType: 'form',
        formSettings: data.formSettings,
        components: data.components,
        eventHandlers: data.eventHandlers ?? [],
        code: data.userCode ?? '',
      };
      set({
        files: [file],
        activeFileId: file.id,
        formSettings: data.formSettings,
        components: data.components,
        eventHandlers: data.eventHandlers ?? [],
        userCode: data.userCode ?? '',
        selectedIds: [],
        history: [],
        historyIndex: -1,
        nextZIndex: Math.max(...data.components.map((c) => c.zIndex), 0) + 1,
      });
    }
  },

  resetProject: () => {
    const freshFile = createFormFile('Form1');
    set({
      files: [freshFile],
      activeFileId: freshFile.id,
      formSettings: { ...freshFile.formSettings! },
      components: [],
      selectedIds: [],
      eventHandlers: [],
      userCode: '',
      viewMode: 'design',
      executionState: 'stopped',
      history: [],
      historyIndex: -1,
      clipboard: [],
      nextZIndex: 1,
      codeEditorTarget: null,
    });
  },
}));
