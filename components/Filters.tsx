
import React from 'react';
import { FilterState, FilterOption } from '../types';
import { JURISDICTIONS, JURISDICTION_COLORS } from '../constants';

interface FiltersProps {
  filters: FilterState;
  acts: FilterOption[];
  legislations: FilterOption[];
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
}

const Filters: React.FC<FiltersProps> = ({ 
  filters, 
  acts, 
  legislations, 
  onFilterChange, 
  onReset 
}) => {
  // Calculate distinct counts (excluding 'All')
  const actCount = Math.max(0, acts.length - 1);
  const legCount = Math.max(0, legislations.length - 1);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Row: Filters (Jurisdiction, Act, Regulation) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-end">
        
        {/* Jurisdiction Group */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jurisdiction</label>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            {JURISDICTIONS.map(j => {
              const isActive = filters.jurisdiction === j;
              // Determine active color style based on jurisdiction constant
              let activeStyle = {};
              if (isActive) {
                 if (j === 'Federal') activeStyle = { backgroundColor: JURISDICTION_COLORS.Federal, color: 'white', borderColor: JURISDICTION_COLORS.Federal };
                 else if (j === 'Provincial') activeStyle = { backgroundColor: JURISDICTION_COLORS.Provincial, color: 'white', borderColor: JURISDICTION_COLORS.Provincial };
                 else activeStyle = { backgroundColor: 'white', color: '#111827', borderColor: '#e5e7eb' };
              }

              return (
                <button
                  key={j}
                  onClick={() => onFilterChange('jurisdiction', j as any)}
                  style={isActive ? activeStyle : {}}
                  className={`px-5 py-2.5 text-xs font-semibold rounded-md transition-all border border-transparent ${
                    !isActive ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-200' : 'shadow-sm'
                  }`}
                >
                  {j}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropdowns Group */}
        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Act ({actCount})
            </label>
            <select
              value={filters.actName}
              onChange={(e) => onFilterChange('actName', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
            >
              {acts.map(a => (
                <option key={a.name} value={a.name}>
                  {a.name === 'All' ? 'All Acts' : a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Regulation ({legCount})
            </label>
            <select
              value={filters.legislationName}
              onChange={(e) => onFilterChange('legislationName', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
            >
              {legislations.map(l => (
                <option key={l.name} value={l.name}>
                  {l.name === 'All' ? 'All Regulations' : l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <button 
          onClick={onReset}
          className="mb-1 p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 shrink-0 self-end xl:self-end"
          title="Reset All Filters"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>

      {/* Bottom Row: Search Input */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Search Legislation</label>
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search content by keywords..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default Filters;
