import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  icon?: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export default function CollapsiblePane({
  title,
  icon,
  collapsed,
  onToggle,
  children,
  className = '',
  actions,
}: Props) {
  return (
    <div className={`flex flex-col overflow-hidden ${className}`}>
      <button
        onClick={onToggle}
        className="h-7 bg-[#EEEEF2] border-b border-[#CCCEDB] flex items-center px-2 gap-1.5 hover:bg-[#E4E4E8] transition-colors shrink-0 w-full text-left group"
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-[#666] shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-[#666] shrink-0" />
        )}
        {icon}
        <span className="text-[11px] font-semibold text-[#1E1E1E] tracking-wide uppercase flex-1 truncate">
          {title}
        </span>
        {actions && (
          <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </button>
      {!collapsed && children}
    </div>
  );
}
