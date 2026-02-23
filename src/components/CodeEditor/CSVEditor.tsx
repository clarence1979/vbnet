import { useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { FileSpreadsheet } from 'lucide-react';

export default function CSVEditor() {
  const userCode = useProjectStore((s) => s.userCode);
  const setUserCode = useProjectStore((s) => s.setUserCode);
  const activeFile = useProjectStore((s) => s.files.find(f => f.id === s.activeFileId));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [userCode]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-8 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center px-3 gap-2">
        <FileSpreadsheet size={14} className="text-[#217346]" />
        <span className="text-[11px] font-medium text-[#1E1E1E]">
          {activeFile?.name || 'Untitled'}.csv
        </span>
        <span className="text-[9px] text-[#999] ml-auto">Plain Text Editor</span>
      </div>

      <div className="flex-1 overflow-auto p-2 bg-white">
        <textarea
          ref={textareaRef}
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          className="w-full h-full min-h-full font-mono text-[13px] text-[#1E1E1E] bg-white resize-none outline-none border-none"
          placeholder="Enter CSV data here...&#10;&#10;Example:&#10;Name,Age,City&#10;John,25,New York&#10;Jane,30,Los Angeles"
          spellCheck={false}
        />
      </div>

      <div className="h-6 bg-[#F8F8F8] border-t border-[#CCCEDB] flex items-center px-3">
        <span className="text-[10px] text-[#666]">
          Lines: {userCode.split('\n').length} | Characters: {userCode.length}
        </span>
      </div>
    </div>
  );
}
