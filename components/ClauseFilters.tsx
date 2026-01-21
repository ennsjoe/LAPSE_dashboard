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
    <div className="space-y-3 p-4 border-t border-gray-200 bg-white">
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
        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">Discretion Type</label>
        <select
          value={discretionType}
          onChange={(e) => onFilterChange('discretionType', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {discretionTypeOptions.map(option => (
            <option key={option.name} value={option.name}>
              {option.name === 'All' ? 'None Selected' : option.name} ({option.count})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ClauseFilters;
