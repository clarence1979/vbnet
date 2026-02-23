import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
  children: React.ReactNode;
  width?: string;
}

export default function CollapsibleSidebar({
  collapsed,
  onToggle,
  side,
  children,
  width = 'w-52',
}: Props) {
  if (collapsed) {
    return (
      <div
        className={`flex flex-col ${
          side === 'left' ? 'border-r' : 'border-l'
        } border-[#CCCEDB] bg-[#EEEEF2] shrink-0`}
      >
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-[#D4D4D8] transition-colors"
          title={side === 'left' ? 'Expand sidebar' : 'Expand panel'}
        >
          {side === 'left' ? (
            <PanelLeftOpen size={14} className="text-[#555]" />
          ) : (
            <PanelRightOpen size={14} className="text-[#555]" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${width} flex flex-col ${
        side === 'left' ? 'border-r' : 'border-l'
      } border-[#CCCEDB] overflow-hidden shrink-0`}
    >
      <div className="flex items-center bg-[#EEEEF2] border-b border-[#CCCEDB] shrink-0">
        <div className="flex-1" />
        <button
          onClick={onToggle}
          className="p-1 hover:bg-[#D4D4D8] transition-colors mr-1"
          title={side === 'left' ? 'Collapse sidebar' : 'Collapse panel'}
        >
          {side === 'left' ? (
            <PanelLeftClose size={13} className="text-[#555]" />
          ) : (
            <PanelRightClose size={13} className="text-[#555]" />
          )}
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
