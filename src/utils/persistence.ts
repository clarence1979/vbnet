import type { FormComponent, FormSettings, EventHandler, ProjectFile } from '../types/component.types';
import { generateId } from './idGenerator';

const STORAGE_KEY = 'vbnet-designer-autosave';

export interface SavedProject {
  formSettings?: FormSettings;
  components?: FormComponent[];
  eventHandlers?: EventHandler[];
  userCode?: string;
  files?: ProjectFile[];
  savedAt: string;
}

export function autoSaveProject(files: ProjectFile[]) {
  try {
    const project: SavedProject = { files, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    // storage full or unavailable
  }
}

export function loadAutoSave(): SavedProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProject;
  } catch {
    return null;
  }
}

export function savedProjectHasContent(saved: SavedProject): boolean {
  if (saved.files && saved.files.length > 0) {
    return saved.files.some(
      (f) => (f.components && f.components.length > 0) || f.code.trim().length > 0
    );
  }
  return (saved.components && saved.components.length > 0) || false;
}

export function normalizeProject(saved: SavedProject): { files: ProjectFile[] } {
  if (saved.files && saved.files.length > 0) {
    return { files: saved.files };
  }
  if (saved.formSettings && saved.components) {
    const file: ProjectFile = {
      id: generateId(),
      name: saved.formSettings.name,
      fileType: 'form',
      formSettings: saved.formSettings,
      components: saved.components,
      eventHandlers: saved.eventHandlers ?? [],
      code: saved.userCode ?? '',
    };
    return { files: [file] };
  }
  return { files: [] };
}

export function clearAutoSave() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportProjectJSON(files: ProjectFile[]): string {
  return JSON.stringify({ files, savedAt: new Date().toISOString() }, null, 2);
}

export function downloadText(content: string, filename: string, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
