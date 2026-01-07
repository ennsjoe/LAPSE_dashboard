
import React from 'react';
import { LegislationItem } from '../types';
import { JURISDICTION_COLORS } from '../constants';

interface LegislationListProps {
  items: LegislationItem[];
  searchTerm: string;
}

const Highlight: React.FC<{ text: string; term: string }> = ({ text, term }) => {
  if (!term || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === term.toLowerCase() 
          ? <span key={i} className="bg-yellow-100 text-yellow-800 px-0.5 rounded font-medium">{part}</span> 
          : part
      )}
    </>
  );
};

const LegislationList: React.FC<LegislationListProps> = ({ items, searchTerm }) => {
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-gray-300 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <p className="text-gray-500 font-medium">No legislative items match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Showing {items.length} records</div>
      {items.map((item, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white shadow-sm"
                style={{ backgroundColor: JURISDICTION_COLORS[item.jurisdiction] }}
              >
                {item.jurisdiction}
              </span>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                <Highlight text={item.act_name} term={searchTerm} />
              </h3>
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
              Section {item.section}
            </span>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-semibold text-blue-600 mb-1">
              <Highlight text={item.heading} term={searchTerm} />
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
              <Highlight text={item.aggregate_paragraph || "No text content available."} term={searchTerm} />
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-50 pt-4 mt-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase">Management Domain</span>
              <span className="text-[11px] font-medium text-gray-700">{item.management_domain}</span>
            </div>
            <div className="w-[1px] bg-gray-100 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase">Scope</span>
              <span className="text-[11px] font-medium text-gray-700">{item.scope || 'Unspecified'}</span>
            </div>
            <div className="w-[1px] bg-gray-100 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase">IUCN Threat</span>
              <span className="text-[11px] font-medium text-gray-700">{item.iucn_threat || 'N/A'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LegislationList;
