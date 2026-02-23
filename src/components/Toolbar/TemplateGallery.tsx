import { X, Layout } from 'lucide-react';
import { EXAMPLES } from '../../utils/templates';
import type { ProjectExample } from '../../utils/templates';

interface Props {
  onSelect: (example: ProjectExample) => void;
  onClose: () => void;
}

export default function ExampleGallery({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="bg-[#0078D4] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <span className="text-white text-sm font-medium">Project Examples</span>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-xs text-[#888] mb-4">Choose an example to get started quickly</p>
          <div className="grid grid-cols-1 gap-3">
            {EXAMPLES.map((t) => (
              <button
                key={t.name}
                onClick={() => onSelect(t)}
                className="flex items-center gap-4 p-4 bg-[#F9F9F9] border border-[#E0E0E0] rounded-lg hover:border-[#0078D4] hover:bg-[#F0F7FF] transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#0078D4]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0078D4]/20 transition-colors">
                  <Layout size={20} className="text-[#0078D4]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#1E1E1E] group-hover:text-[#0078D4] transition-colors">
                    {t.name}
                  </div>
                  <div className="text-xs text-[#888] mt-0.5">{t.description}</div>
                  <div className="text-[10px] text-[#AAAAAA] mt-1">
                    {t.components.length} components
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
