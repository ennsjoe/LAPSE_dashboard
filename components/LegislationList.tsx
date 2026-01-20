
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
          ? <span key={i} className="px-0.5 rounded font-medium" style={{ backgroundColor: '#E8F0F5', color: '#5FA3D0' }}>{part}</span> 
          : part
      )}
    </>
  );
};

const LegislationList: React.FC<LegislationListProps> = ({ items, searchTerm, onClear }) => {
  if (items.length === 0) {
    return (
      <div className="py-32 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
        <div className="text-gray-300 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <p className="text-gray-900 font-black text-lg mb-2">No Matches Found</p>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">Try broadening your keywords or changing the management domain.</p>
        {onClear && (
          <button 
            onClick={onClear}
            className="text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
            style={{ backgroundColor: '#6FA577' }}
          >
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Displaying {items.length} legislative records</div>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all group border-l-4" style={{ borderLeftColor: JURISDICTION_COLORS[item.jurisdiction] }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white shadow-sm"
                style={{ backgroundColor: JURISDICTION_COLORS[item.jurisdiction] }}
              >
                {item.jurisdiction}
              </span>
              <h3 className="text-sm font-black text-gray-900 leading-tight">
                <Highlight text={item.act_name} term={searchTerm} />
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              SEC. {item.section}
            </span>
          </div>

          <div className="mb-6">
            <h4 className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
              <Highlight text={item.heading} term={searchTerm} />
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
              <Highlight text={item.aggregate_paragraph || "Text summary unavailable for this section."} term={searchTerm} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-y-4 gap-x-6 border-t border-gray-50 pt-5 mt-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Management Domain</span>
              <span className="text-[11px] font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded">{item.management_domain}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Scope</span>
              <span className="text-[11px] font-bold text-gray-800">{item.scope || 'General'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Threat Class</span>
              <span className="text-[11px] font-bold text-gray-800">{item.iucn_threat || 'N/A'}</span>
            </div>
            
            {/* Actionable Clause Badges */}
            {(item.actionable_type || item.responsible_official || item.discretion_type) && (
              <div className="w-full border-t border-gray-100 pt-4 mt-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-2 block">Actionable Clause Details</span>
                <div className="flex flex-wrap gap-2">
                  {item.actionable_type && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      {item.actionable_type}
                    </span>
                  )}
                  {item.responsible_official && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {item.responsible_official}
                    </span>
                  )}
                  {item.discretion_type && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fff3e0', color: '#f57c00' }}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      {item.discretion_type}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LegislationList;
