
import React from 'react';
import { FilterState, FilterOption } from '../types';
import { JURISDICTIONS } from '../constants';

interface FiltersProps {
  filters: FilterState;
  acts: FilterOption[];
  legislations: FilterOption[];
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, acts, legislations, onFilterChange, onReset }) => {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Jurisdiction</label>
        <select 
          value={filters.jurisdiction}
          onChange={(e) => onFilterChange('jurisdiction', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        >
          {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Act / Regulation Group</label>
        <select 
          value={filters.actName}
          onChange={(e) => onFilterChange('actName', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        >
          {acts.map(a => <option key={a.name} value={a.name}>{a.name} ({a.count})</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Specific Legislation</label>
        <select 
          value={filters.legislationName}
          onChange={(e) => onFilterChange('legislationName', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        >
          {legislations.map(l => <option key={l.name} value={l.name}>{l.name} ({l.count})</option>)}
        </select>
      </div>

      <button 
        onClick={onReset}
        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default Filters;
