import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppWindow,
  FileCode2,
  Braces,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  FolderOpen,
  Folder,
  FolderPlus,
  X,
  Check,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { ProjectFileType, ProjectFile } from '../../types/component.types';

function FileIcon({ type }: { type: ProjectFileType }) {
  switch (type) {
    case 'form':
      return <AppWindow size={14} className="text-[#0078D4] shrink-0" />;
    case 'module':
      return <FileCode2 size={14} className="text-[#16825D] shrink-0" />;
    case 'class':
      return <Braces size={14} className="text-[#C27D1A] shrink-0" />;
    case 'csv':
      return <FileSpreadsheet size={14} className="text-[#217346] shrink-0" />;
    case 'folder':
      return <Folder size={14} className="text-[#C27D1A] shrink-0" />;
  }
}

function fileExtension(type: ProjectFileType): string {
  if (type === 'folder') return '';
  if (type === 'csv') return '.csv';
  return '.vb';
}

function fileTypeLabel(type: ProjectFileType): string {
  switch (type) {
    case 'form': return 'Form';
    case 'module': return 'Module';
    case 'class': return 'Class';
    case 'csv': return 'CSV';
    case 'folder': return 'Folder';
  }
}

interface ContextMenuState {
  x: number;
  y: number;
  fileId: string;
}

export default function FileExplorer() {
  const files = useProjectStore((s) => s.files);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const addFile = useProjectStore((s) => s.addFile);
  const removeFile = useProjectStore((s) => s.removeFile);
  const renameFile = useProjectStore((s) => s.renameFile);
  const toggleFolder = useProjectStore((s) => s.toggleFolder);
  const moveFile = useProjectStore((s) => s.moveFile);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);
  const formSettings = useProjectStore((s) => s.formSettings);

  const [collapsed, setCollapsed] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuParent, setAddMenuParent] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = useCallback(
    (type: ProjectFileType) => {
      addFile(type, undefined, addMenuParent || undefined);
      setShowAddMenu(false);
      setAddMenuParent(null);
    },
    [addFile, addMenuParent]
  );

  const handleStartRename = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      const currentName = id === activeFileId && file.fileType === 'form'
        ? formSettings.name
        : file.name;
      setRenamingId(id);
      setRenameValue(currentName);
      setContextMenu(null);
    },
    [files, activeFileId, formSettings.name]
  );

  const handleConfirmRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameFile(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, renameFile]);

  const handleDelete = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      const formCount = files.filter((f) => f.fileType === 'form').length;
      if (file.fileType === 'form' && formCount <= 1) return;
      removeFile(id);
      setContextMenu(null);
    },
    [files, removeFile]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, fileId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    },
    []
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, fileId: string) => {
      e.stopPropagation();
      setDraggingId(fileId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', fileId);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(targetId);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string | null) => {
      e.preventDefault();
      e.stopPropagation();

      const droppedFiles = e.dataTransfer.files;

      if (droppedFiles.length > 0) {
        // Handle file upload
        Array.from(droppedFiles).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            const fileName = file.name.replace(/\.(vb|txt|csv)$/i, '');

            // Detect file type based on extension first, then content
            let fileType: ProjectFileType = 'module';
            if (file.name.toLowerCase().endsWith('.csv')) {
              fileType = 'csv';
            } else if (content.includes('Public Class') || content.includes('Private Class')) {
              fileType = 'class';
            } else if (content.includes('<System.ComponentModel.Design.Serialization.DesignerSerializationVisibility')) {
              fileType = 'form';
            }

            const fileId = addFile(fileType, fileName, targetId || undefined);

            // Set the file content for CSV and other uploaded files
            if (content && fileId) {
              setTimeout(() => {
                updateFileContent(fileId, content);
              }, 0);
            }
          };
          reader.readAsText(file);
        });
      } else {
        // Handle internal drag and drop
        const fileId = e.dataTransfer.getData('text/plain');
        if (fileId && fileId !== targetId) {
          const targetFile = targetId ? files.find((f) => f.id === targetId) : null;
          if (!targetFile || targetFile.fileType === 'folder') {
            moveFile(fileId, targetId);
          }
        }
      }

      setDragOverId(null);
      setDraggingId(null);
      setIsDraggingFile(false);
    },
    [files, moveFile, addFile]
  );

  const handleDragEnd = useCallback(() => {
    setDragOverId(null);
    setDraggingId(null);
  }, []);

  const handleExplorerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  }, []);

  const handleExplorerDragLeave = useCallback((e: React.DragEvent) => {
    if (explorerRef.current && !explorerRef.current.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleExplorerDrop = useCallback(
    (e: React.DragEvent) => {
      handleDrop(e, null);
    },
    [handleDrop]
  );

  const buildFileTree = useCallback(() => {
    const tree: ProjectFile[] = [];
    const fileMap = new Map<string, ProjectFile>();

    files.forEach((file) => {
      fileMap.set(file.id, file);
    });

    files.forEach((file) => {
      if (!file.parentId) {
        tree.push(file);
      }
    });

    return tree;
  }, [files]);

  const renderFile = useCallback(
    (file: ProjectFile, depth: number = 0): JSX.Element => {
      const isActive = file.id === activeFileId && file.fileType !== 'folder';
      const displayName = isActive && file.fileType === 'form'
        ? formSettings.name
        : file.name;
      const isDragging = draggingId === file.id;
      const isDragOver = dragOverId === file.id;

      const children = file.fileType === 'folder'
        ? files.filter((f) => f.parentId === file.id)
        : [];

      return (
        <div key={file.id}>
          <div
            draggable={file.fileType !== 'folder' || true}
            onDragStart={(e) => handleDragStart(e, file.id)}
            onDragOver={(e) => file.fileType === 'folder' ? handleDragOver(e, file.id) : e.preventDefault()}
            onDrop={(e) => file.fileType === 'folder' ? handleDrop(e, file.id) : undefined}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-1.5 py-[3px] cursor-pointer transition-colors group ${
              isActive
                ? 'bg-[#C9DEF5] text-[#005FB8]'
                : isDragOver && file.fileType === 'folder'
                ? 'bg-[#FFF4CE]'
                : 'text-[#1E1E1E] hover:bg-[#E0E0E0]'
            } ${isDragging ? 'opacity-50' : ''}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => {
              if (file.fileType === 'folder') {
                toggleFolder(file.id);
              } else {
                setActiveFile(file.id);
              }
            }}
            onDoubleClick={() => {
              if (file.fileType !== 'folder') {
                handleStartRename(file.id);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, file.id)}
          >
            {file.fileType === 'folder' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(file.id);
                }}
                className="p-0.5 hover:bg-[#D4D4D8] rounded shrink-0"
              >
                {file.isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
            {file.fileType === 'folder' ? (
              file.isExpanded ? (
                <FolderOpen size={14} className="text-[#C27D1A] shrink-0" />
              ) : (
                <Folder size={14} className="text-[#C27D1A] shrink-0" />
              )
            ) : (
              <FileIcon type={file.fileType} />
            )}
            {renamingId === file.id ? (
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={handleConfirmRename}
                  className="flex-1 text-[11px] px-1 py-0 border border-[#0078D4] outline-none bg-white rounded-sm"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmRename();
                  }}
                  className="p-0.5 hover:bg-[#D4D4D8] rounded"
                >
                  <Check size={10} className="text-green-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(null);
                  }}
                  className="p-0.5 hover:bg-[#D4D4D8] rounded"
                >
                  <X size={10} className="text-red-500" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-[11px] truncate flex-1">
                  {displayName}{fileExtension(file.fileType)}
                </span>
                {file.fileType === 'folder' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddMenuParent(file.id);
                      setShowAddMenu(true);
                    }}
                    className="p-0.5 hover:bg-[#D4D4D8] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add to folder"
                  >
                    <Plus size={11} className="text-[#444]" />
                  </button>
                )}
                <span className="text-[9px] text-[#999] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  {fileTypeLabel(file.fileType)}
                </span>
              </>
            )}
          </div>
          {file.fileType === 'folder' && file.isExpanded && children.map((child) => renderFile(child, depth + 1))}
        </div>
      );
    },
    [
      activeFileId,
      formSettings.name,
      draggingId,
      dragOverId,
      files,
      renamingId,
      renameValue,
      handleStartRename,
      handleConfirmRename,
      handleContextMenu,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
      setActiveFile,
      toggleFolder,
    ]
  );

  const fileTree = buildFileTree();

  return (
    <div
      ref={explorerRef}
      className="flex flex-col bg-[#F5F5F5] border-b border-[#CCCEDB] select-none relative"
      onDragOver={handleExplorerDragOver}
      onDragLeave={handleExplorerDragLeave}
      onDrop={handleExplorerDrop}
    >
      <div className="h-7 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center px-2 gap-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 hover:bg-[#D4D4D8] rounded transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>
        <FolderOpen size={12} className="text-[#C27D1A]" />
        <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide flex-1">
          Solution Explorer
        </span>
        <div className="relative">
          <button
            onClick={() => {
              setAddMenuParent(null);
              setShowAddMenu(!showAddMenu);
            }}
            className="p-0.5 hover:bg-[#D4D4D8] rounded transition-colors"
            title="Add File"
          >
            <Plus size={13} className="text-[#444]" />
          </button>
          {showAddMenu && (
            <div
              ref={addMenuRef}
              className="absolute right-0 top-full mt-1 bg-white border border-[#CCCEDB] rounded shadow-lg z-50 py-1 min-w-[160px]"
            >
              <button
                onClick={() => handleAdd('folder')}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#1E1E1E] hover:bg-[#E8E8EC] flex items-center gap-2"
              >
                <FolderPlus size={13} className="text-[#C27D1A]" />
                New Folder
              </button>
              <div className="h-px bg-[#E0E0E0] mx-2 my-0.5" />
              <button
                onClick={() => handleAdd('form')}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#1E1E1E] hover:bg-[#E8E8EC] flex items-center gap-2"
              >
                <AppWindow size={13} className="text-[#0078D4]" />
                Windows Form
              </button>
              <button
                onClick={() => handleAdd('module')}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#1E1E1E] hover:bg-[#E8E8EC] flex items-center gap-2"
              >
                <FileCode2 size={13} className="text-[#16825D]" />
                Module
              </button>
              <button
                onClick={() => handleAdd('class')}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#1E1E1E] hover:bg-[#E8E8EC] flex items-center gap-2"
              >
                <Braces size={13} className="text-[#C27D1A]" />
                Class
              </button>
              <button
                onClick={() => handleAdd('csv')}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[#1E1E1E] hover:bg-[#E8E8EC] flex items-center gap-2"
              >
                <FileSpreadsheet size={13} className="text-[#217346]" />
                CSV File
              </button>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="py-0.5 relative">
          {fileTree.map((file) => renderFile(file, 0))}

          {files.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-[#999] italic">
              No files in project
            </div>
          )}

          {isDraggingFile && (
            <div className="absolute inset-0 bg-[#E8F4FF] bg-opacity-80 border-2 border-dashed border-[#0078D4] flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-[#0078D4]">
                <Upload size={24} />
                <span className="text-sm font-medium">Drop files to upload</span>
              </div>
            </div>
          )}
        </div>
      )}

      {contextMenu && (
        <ContextMenuPopup
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          fileId={contextMenu.fileId}
          onRename={() => handleStartRename(contextMenu.fileId)}
          onDelete={() => handleDelete(contextMenu.fileId)}
          onClose={() => setContextMenu(null)}
          canDelete={
            (() => {
              const f = files.find((ff) => ff.id === contextMenu.fileId);
              if (!f) return false;
              if (f.fileType === 'form') {
                return files.filter((ff) => ff.fileType === 'form').length > 1;
              }
              return true;
            })()
          }
        />
      )}
    </div>
  );
}

interface ContextMenuPopupProps {
  x: number;
  y: number;
  fileId: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
  canDelete: boolean;
}

const ContextMenuPopup = ({
  x,
  y,
  onRename,
  onDelete,
  onClose,
  canDelete,
  ref,
}: ContextMenuPopupProps & { ref: React.Ref<HTMLDivElement> }) => {
  return (
    <div
      ref={ref}
      className="fixed bg-white border border-[#CCCEDB] rounded shadow-xl z-[9999] py-1 min-w-[140px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 text-[12px] text-[#1E1E1E] hover:bg-[#E8E8EC] flex items-center gap-2"
      >
        <Pencil size={12} className="text-[#616161]" />
        Rename
      </button>
      <div className="h-px bg-[#E0E0E0] mx-2 my-0.5" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        disabled={!canDelete}
        className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 ${
          canDelete
            ? 'text-[#D32F2F] hover:bg-[#FDECEA]'
            : 'text-[#999] cursor-not-allowed'
        }`}
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  );
};
