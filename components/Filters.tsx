
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
      <div className="flex-1 min-w-[180px]">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Search Keywords</label>
        <div className="relative">
          <input 
            type="text"
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            placeholder="e.g. 'habitat', 'spawning'..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jurisdiction</label>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => onFilterChange('jurisdiction', 'All')}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded transition-all ${
              filters.jurisdiction === 'All'
                ? 'bg-gray-400 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            Both
          </button>
          <button
            onClick={() => onFilterChange('jurisdiction', 'Federal')}
            style={{
              backgroundColor: filters.jurisdiction === 'Federal' ? '#996666' : 'transparent',
              color: filters.jurisdiction === 'Federal' ? 'white' : '#4b5563'
            }}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded transition-all hover:bg-gray-200"
          >
            Federal
          </button>
          <button
            onClick={() => onFilterChange('jurisdiction', 'Provincial')}
            style={{
              backgroundColor: filters.jurisdiction === 'Provincial' ? '#668899' : 'transparent',
              color: filters.jurisdiction === 'Provincial' ? 'white' : '#4b5563'
            }}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded transition-all hover:bg-gray-200"
          >
            Provincial
          </button>
        </div>
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
        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors whitespace-nowrap"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default Filters;
