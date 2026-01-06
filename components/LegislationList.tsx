
import React, { useState } from 'react';
import { LegislationItem } from '../types';
import { JURISDICTION_COLORS } from '../constants';

interface LegislationListProps {
  items: LegislationItem[];
  searchTerm: string;
}

const LegislationList: React.FC<LegislationListProps> = ({ items, searchTerm }) => {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No matching legislation found.
        </div>
      ) : (
        items.map((item) => (
          <LegislationCard key={item.id} item={item} searchTerm={searchTerm} />
        ))
      )}
    </div>
  );
};

const LegislationCard: React.FC<{ item: LegislationItem; searchTerm: string }> = ({ item, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getHighlightedText = (text: string) => {
    if (!text) return '';

    const domainKeywords = (item.management_domain_keywords?.split(';') || [])
      .map(k => k.trim())
      .filter(k => k.length > 1);
    
    const clauseKeywords = (item.clause_type_keywords?.split(';') || [])
      .map(k => k.trim())
      .filter(k => k.length > 1);

    // Escape special characters for regex
    const escape = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    let processedText: React.ReactNode[] = [text];

    // Highlight search term first (yellow)
    if (searchTerm && searchTerm.length > 1) {
      const regex = new RegExp(`(${escape(searchTerm)})`, 'gi');
      processedText = processedText.flatMap(node => {
        if (typeof node !== 'string') return node;
        const parts = node.split(regex);
        return parts.map((part, i) => 
          regex.test(part) ? <mark key={`search-${i}`} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark> : part
        );
      });
    }

    // Highlight domain keywords (red)
    if (domainKeywords.length > 0) {
      const regex = new RegExp(`\\b(${domainKeywords.map(escape).join('|')})\\b`, 'gi');
      processedText = processedText.flatMap(node => {
        if (typeof node !== 'string') return node;
        const parts = node.split(regex);
        return parts.map((part, i) => 
          regex.test(part) ? <span key={`domain-${i}`} className="highlight-domain">{part}</span> : part
        );
      });
    }

    // Highlight clause keywords (blue)
    if (clauseKeywords.length > 0) {
      const regex = new RegExp(`\\b(${clauseKeywords.map(escape).join('|')})\\b`, 'gi');
      processedText = processedText.flatMap(node => {
        if (typeof node !== 'string') return node;
        const parts = node.split(regex);
        return parts.map((part, i) => 
          regex.test(part) ? <span key={`clause-${i}`} className="highlight-clause">{part}</span> : part
        );
      });
    }

    return processedText;
  };

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
      isExpanded ? 'ring-2 ring-blue-500 shadow-md border-transparent' : 'border-gray-200 hover:border-gray-300 shadow-sm'
    }`}>
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1">
          <span 
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white w-fit"
            style={{ backgroundColor: JURISDICTION_COLORS[item.jurisdiction] }}
          >
            {item.jurisdiction}
          </span>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-gray-400">SEC {item.section}</span>
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.heading}</h4>
            </div>
            <p className="text-xs text-gray-500 font-medium">{item.legislation_name}</p>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-tight text-gray-400">
             <div className="flex flex-col items-end">
               <span>DOMAIN</span>
               <span className="text-gray-600">{item.management_domain}</span>
             </div>
             <div className="flex flex-col items-end">
               <span>SCOPE</span>
               <span className="text-gray-600">{item.scope}</span>
             </div>
          </div>
        </div>
        
        <div className={`ml-4 transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-t border-gray-100 pt-4 mb-4">
             <div className="bg-gray-50 rounded-lg p-6 font-serif text-lg leading-relaxed text-gray-800 shadow-inner border border-gray-200">
                {getHighlightedText(item.aggregate_paragraph)}
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
             <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 text-gray-600 rounded">
               IUCN: {item.iucn_threat}
             </span>
             <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 text-gray-600 rounded">
               CLAUSE: {item.clause_type}
             </span>
          </div>
          
          <div className="flex justify-end">
            <button className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider">
              View Full Legislation
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegislationList;
