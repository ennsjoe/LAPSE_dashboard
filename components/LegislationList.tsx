
import React from 'react';
import { LegislationItem } from '../types';
import { JURISDICTION_COLORS } from '../constants';

interface LegislationListProps {
  items: LegislationItem[];
  searchTerm: string;
  onClear?: () => void;
}

const Highlight: React.FC<{ text: string; term: string }> = ({ text, term }) => {
  if (!term || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === term.toLowerCase() 
          ? <span key={i} className="px-0.5 rounded font-medium" style={{ backgroundColor: '#ffff00', color: '#333' }}>{part}</span> 
          : part
      )}
    </>
  );
};

const LegislationList: React.FC<LegislationListProps> = ({ items, searchTerm, onClear }) => {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center bg-gray-50 rounded border border-gray-200">
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p className="text-gray-700 font-bold text-sm mb-2">No Matches Found</p>
        <p className="text-gray-500 text-xs mb-4">Try broadening your filters.</p>
        {onClear && (
          <button 
            onClick={onClear}
            className="text-white px-4 py-2 rounded text-xs font-bold uppercase"
            style={{ backgroundColor: '#6FA577' }}
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white rounded border border-gray-200 p-3 hover:shadow-md transition-all" style={{ borderLeftColor: JURISDICTION_COLORS[item.jurisdiction], borderLeftWidth: '3px' }}>
          <div className="flex items-start gap-2 mb-2">
            <span 
              className="px-2 py-0.5 rounded text-[8px] font-bold uppercase text-white flex-shrink-0"
              style={{ backgroundColor: JURISDICTION_COLORS[item.jurisdiction] }}
            >
              {item.jurisdiction[0]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-800 truncate">
                <Highlight text={item.act_name} term={searchTerm} />
              </div>
              <div className="text-[11px] text-gray-600 truncate">
                <Highlight text={item.heading} term={searchTerm} />
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-gray-500 flex-shrink-0">§{item.section}</span>
          </div>

          <p className="text-[11px] text-gray-600 line-clamp-2 leading-tight mb-2">
            <Highlight text={item.aggregate_paragraph || "Text summary unavailable"} term={searchTerm} />
          </p>

          <div className="flex flex-wrap gap-1 text-[9px]">
            {item.management_domain && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">{item.management_domain}</span>
            )}
            {item.iucn_threat && (
              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">{item.iucn_threat}</span>
            )}
            {item.clause_type && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">{item.clause_type}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LegislationList;
