import React from 'react';
import { ArrowDownUp, LayoutGrid, List, RefreshCcw, Search } from 'lucide-react';
import type { SortMode, ViewMode } from '../types';

interface TopbarProps {
  updatesCount: number;
  onUpdateAll: () => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  updatesCount,
  onUpdateAll,
  sortMode,
  onSortChange,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="h-16 border-b border-border bg-[#0E1014]/80 backdrop-blur flex items-center justify-between px-5 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {updatesCount > 0 && (
          <button
            onClick={onUpdateAll}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-acid text-black font-semibold text-sm hover:brightness-110 transition shadow-glowLime"
            title="Update all applications with available updates"
          >
            <RefreshCcw size={16} /> UPDATE ALL ({updatesCount})
          </button>
        )}
        <div className="relative w-[320px] max-w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search apps..."
            className="w-full bg-[#121418] border border-border rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-lime/40 focus:shadow-glowLime placeholder:text-muted/70"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-[#121418]">
          <ArrowDownUp size={14} className="text-muted" />
          <select
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as SortMode)}
            className="bg-transparent text-sm outline-none text-text pr-1 cursor-pointer"
          >
            <option value="name">Name A-Z</option>
            <option value="recently-updated">Recently Updated</option>
            <option value="updates-first">Updates First</option>
          </select>
        </div>
        <div className="flex items-center rounded-md border border-border overflow-hidden bg-[#121418]">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-[#1A1F27] text-lime' : 'text-muted hover:text-text'}`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 border-l border-border ${viewMode === 'list' ? 'bg-[#1A1F27] text-lime' : 'text-muted hover:text-text'}`}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
