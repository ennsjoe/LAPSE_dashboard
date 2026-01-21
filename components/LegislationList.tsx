
import React from 'react';
import { LegislationItem } from '../types';
import { JURISDICTION_COLORS } from '../constants';

interface LegislationListProps {
  items: LegislationItem[];
  searchTerm: string;
  selectedActName: string;
  selectedLegislationName: string;
  activeDomain: string;
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

const KeywordHighlight: React.FC<{ text: string; keywords: string[] }> = ({ text, keywords }) => {
  if (!keywords || keywords.length === 0 || !text) return <>{text}</>;
  
  // Create a regex pattern that matches any of the keywords (case-insensitive, whole word)
  const pattern = keywords
    .filter(k => k && k.trim())
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex chars
    .join('|');
  
  if (!pattern) return <>{text}</>;
  
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        const isKeyword = keywords.some(k => 
          k && part.toLowerCase() === k.toLowerCase()
        );
        return isKeyword
          ? <mark key={i} className="bg-blue-200 text-blue-900 px-0.5 rounded font-semibold">{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </>
  );
};

const LegislationList: React.FC<LegislationListProps> = ({ items, searchTerm, activeDomain, selectedActName, selectedLegislationName, onClear }) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

  const toggleExpanded = (idx: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // Check if we should highlight keywords (domain is selected and not 'All')
  const shouldHighlightKeywords = activeDomain && activeDomain !== 'All';

  // Group items by legislation and section, then aggregate paragraphs (headings may vary within a section)
  const groupedItems = React.useMemo(() => {
    const groups = new Map<string, LegislationItem[]>();
    
    items.forEach(item => {
      const sectionKey = (item.section && item.section.trim()) || (item.heading && item.heading.trim()) || `para-${item.paragraph_id}`;
      const key = `${item.legislation_id}|${sectionKey}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    // For each group, sort by paragraph_id and aggregate
    return Array.from(groups.values()).map(group => {
      // Sort by paragraph_id ascending
      const sortedGroup = [...group].sort((a, b) => a.paragraph_id - b.paragraph_id);
      
      const headingCandidates = sortedGroup.map(g => g.heading).filter(Boolean).map(h => h.trim());
      const uniqueHeadings = Array.from(new Set(headingCandidates.filter(Boolean)));
      const displayHeading = uniqueHeadings.length > 0 ? uniqueHeadings.join(' | ') : (sortedGroup[0].heading || '');

      // Use the first item as the base, but aggregate the paragraphs
      const aggregatedItem = {
        ...sortedGroup[0],
        heading: displayHeading,
        paragraph: sortedGroup
          .map(item => item.paragraph)
          .filter(p => p && p.trim())
          .join('\n\n'),
        paragraphBlocks: sortedGroup.map(p => ({
          heading: p.heading,
          text: p.paragraph
        }))
      };
      
      return aggregatedItem;
    });
  }, [items]);

  const allExpanded = groupedItems.length > 0 && expandedItems.size === groupedItems.length;
  const showHeadingAsTitle = (selectedActName && selectedActName !== 'All') || (selectedLegislationName && selectedLegislationName !== 'All');

  const handleExpandAll = () => {
    if (allExpanded) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(groupedItems.map((_, idx) => idx)));
    }
  };

  if (groupedItems.length === 0) {
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
      <div className="flex justify-end mb-1">
        <button
          onClick={handleExpandAll}
          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded px-3 py-1 transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      {groupedItems.map((item, idx) => (
        <div key={idx} className="bg-white rounded border border-gray-200 p-3 hover:shadow-md transition-all" style={{ borderLeftColor: JURISDICTION_COLORS[item.jurisdiction], borderLeftWidth: '3px' }}>
          <div className="flex items-start gap-2 mb-2">
            <span 
              className="px-2 py-0.5 rounded text-[8px] font-bold uppercase text-white flex-shrink-0"
              style={{ backgroundColor: JURISDICTION_COLORS[item.jurisdiction] }}
            >
              {item.jurisdiction[0]}
            </span>
            <div className="flex-1 min-w-0">
              {showHeadingAsTitle ? (
                <div className="text-xs font-bold text-gray-800 line-clamp-2">
                  {shouldHighlightKeywords ? (
                    <KeywordHighlight 
                      text={item.heading} 
                      keywords={(item.mgmt_d_keyword || '').split(';').map(k => k.trim()).filter(k => k.length > 0)}
                    />
                  ) : (
                    <Highlight text={item.heading} term={searchTerm} />
                  )}
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold text-gray-800 truncate">
                    <Highlight text={item.act_name} term={searchTerm} />
                  </div>
                  <div className="text-[11px] text-gray-600 truncate">
                    {shouldHighlightKeywords ? (
                      <KeywordHighlight 
                        text={item.heading} 
                        keywords={(item.mgmt_d_keyword || '').split(';').map(k => k.trim()).filter(k => k.length > 0)}
                      />
                    ) : (
                      <Highlight text={item.heading} term={searchTerm} />
                    )}
                  </div>
                </>
              )}
            </div>
            <span className="text-[11px] font-mono font-bold text-gray-600 flex-shrink-0">Section {item.section}</span>
          </div>

          <div className="mb-2">
            <div className={`space-y-2 ${!expandedItems.has(idx) ? 'line-clamp-2' : ''}`}>
              {(() => {
                const seenHeadings = new Set<string>();
                return ((item as any).paragraphBlocks || [{ heading: item.heading, text: item.paragraph }]).map((block: any, blockIdx: number) => {
                  const headingTextRaw = block.heading || '';
                  const headingText = headingTextRaw.trim();
                  const paraText = block.text || "Text summary unavailable";
                  const headingKey = headingText.toLowerCase();
                  const showHeading = headingText && !seenHeadings.has(headingKey);
                  if (showHeading) seenHeadings.add(headingKey);
                  return (
                    <div key={blockIdx} className="whitespace-pre-line text-[11px] text-gray-600 leading-tight">
                      {showHeading && (
                        <div className="text-[10px] font-semibold text-gray-700 mb-0.5">{headingText}</div>
                      )}
                      {shouldHighlightKeywords ? (
                        <KeywordHighlight 
                          text={paraText} 
                          keywords={(item.mgmt_d_keyword || '').split(';').map(k => k.trim()).filter(k => k.length > 0)}
                        />
                      ) : (
                        <Highlight text={paraText} term={searchTerm} />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            {item.paragraph && item.paragraph.length > 150 && (
              <button
                onClick={() => toggleExpanded(idx)}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold mt-1 flex items-center gap-1"
              >
                {expandedItems.has(idx) ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                    Show less
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    Read full text
                  </>
                )}
              </button>
            )}
          </div>

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
