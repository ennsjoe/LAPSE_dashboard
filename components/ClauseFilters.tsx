import React from 'react';
import { FilterOption } from '../types';

interface ClauseFiltersProps {
  clauseType: string;
  actionableType: string;
  responsibleOfficial: string;
  discretionType: string;
  clauseTypeOptions: FilterOption[];
  actionableTypeOptions: FilterOption[];
  responsibleOfficialOptions: FilterOption[];
  discretionTypeOptions: FilterOption[];
  onFilterChange: (key: 'clauseType' | 'actionableType' | 'responsibleOfficial' | 'discretionType', value: string) => void;
}

const ClauseFilters: React.FC<ClauseFiltersProps> = ({
  clauseType,
  actionableType,
  responsibleOfficial,
  discretionType,
  clauseTypeOptions,
  actionableTypeOptions,
  responsibleOfficialOptions,
  discretionTypeOptions,
  onFilterChange,
}) => {
  return (
    <div className="space-y-3 p-4 border-t border-gray-200 bg-gray-100">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
        Clause Filters
      </h4>
      
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">Clause Type</label>
        <select
          value={clauseType}
          onChange={(e) => onFilterChange('clauseType', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {clauseTypeOptions.map(option => (
            <option key={option.name} value={option.name}>
              {option.name === 'All' ? 'None Selected' : option.name} ({option.count})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">Actionable Type</label>
        <select
          value={actionableType}
          onChange={(e) => onFilterChange('actionableType', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {actionableTypeOptions.map(option => (
            <option key={option.name} value={option.name}>
              {option.name === 'All' ? 'None Selected' : option.name} ({option.count})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">Responsible Official</label>
        <select
          value={responsibleOfficial}
          onChange={(e) => onFilterChange('responsibleOfficial', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {responsibleOfficialOptions.map(option => (
            <option key={option.name} value={option.name}>
              {option.name === 'All' ? 'None Selected' : option.name} ({option.count})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
          Discretion Type{' '}
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] normal-case">[</span>
            <svg className="w-2.5 h-2.5 text-red-500 inline" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <svg className="w-2.5 h-2.5 text-yellow-500 inline" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[9px] normal-case">]</span>
          </span>
        </label>
        <select
          value={discretionType}
          onChange={(e) => onFilterChange('discretionType', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {discretionTypeOptions.map(option => {
            const displayName = option.name === 'All' ? 'None Selected' : option.name;
            const lowerName = option.name.toLowerCase();
            let prefix = '';
            if (lowerName === 'mandatory') {
              prefix = '🔴 '; // Red circle for mandatory
            } else if (lowerName === 'discretionary') {
              prefix = '🟡 '; // Yellow circle for discretionary
            }
            return (
              <option key={option.name} value={option.name}>
                {prefix}{displayName} ({option.count})
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default ClauseFilters;
