
import React from 'react';
import { LegislationItem } from '../types';
import { JURISDICTION_COLORS } from '../constants';
import { filterKeywordsByDomain } from '../services/dataService';

interface LegislationListProps {
  items: LegislationItem[];
  searchTerm: string;
  selectedActName: string;
  selectedLegislationName: string;
  activeDomain: string;
  selectedClauseType?: string;
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

const ClauseKeywordUnderline: React.FC<{ text: string; keywords: string[] }> = ({ text, keywords }) => {
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
          ? <span key={i} className="underline decoration-2 decoration-orange-500">{part}</span>
          : <span key={i}>{part}</span>;
      })}
    </>
  );
};

const LegislationList: React.FC<LegislationListProps> = ({ items, searchTerm, activeDomain, selectedActName, selectedLegislationName, selectedClauseType, onClear }) => {
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

  // Helper function to parse section number for sorting
  const parseSectionForSort = (section: string): { isNumeric: boolean; value: number | string } => {
    if (!section) return { isNumeric: false, value: '' };
    
    const trimmed = section.trim();
    // Check if it's purely numeric (including decimals like "5.1", "10.2.3")
    const numericMatch = trimmed.match(/^(\d+(?:\.\d+)*)$/);
    
    if (numericMatch) {
      // Parse as number for comparison, but keep original for display
      return { isNumeric: true, value: parseFloat(numericMatch[1]) };
    }
    
    // Not purely numeric (contains letters or other characters)
    return { isNumeric: false, value: trimmed };
  };

  // Group items by legislation and section, then aggregate paragraphs (headings may vary within a section)
  const groupedItems = React.useMemo(() => {
    const groups = new Map<string, LegislationItem[]>();
    
    items.forEach(item => {
      // Group by legislation_id and section only (not by heading, to aggregate all paragraphs in a section)
      const sectionKey = item.section && item.section.trim() ? item.section.trim() : `para-${item.paragraph_id}`;
      const key = `${item.legislation_id}|${sectionKey}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    // For each group, sort by paragraph_id and aggregate
    const groupedArray = Array.from(groups.values()).map(group => {
      // Sort by paragraph_id ascending
      const sortedGroup = [...group].sort((a, b) => a.paragraph_id - b.paragraph_id);
      
      const headingCandidates = sortedGroup.map(g => g.heading).filter(Boolean).map(h => h.trim());
      const uniqueHeadings = Array.from(new Set(headingCandidates.filter(Boolean)));
      const displayHeading = uniqueHeadings.length > 0 ? uniqueHeadings.join(' | ') : (sortedGroup[0].heading || '');

      // Collect all unique management domains, keywords, IUCN threats, and clause types
      const allDomains = Array.from(new Set(
        sortedGroup.flatMap(p => (p.management_domain || '').split(/[;,]/).map(d => d.trim()).filter(d => d.length > 0))
      ));
      const allKeywords = Array.from(new Set(
        sortedGroup.flatMap(p => (p.mgmt_d_keyword || '').split(';').map(k => k.trim()).filter(k => k.length > 0))
      ));
      const allIucnThreats = Array.from(new Set(
        sortedGroup.flatMap(p => (p.iucn_threat || '').split(/[;,]/).map(t => t.trim()).filter(t => t.length > 0))
      ));
      const allClauseTypes = Array.from(new Set(
        sortedGroup.flatMap(p => (p.clause_type || '').split(';').map(c => c.trim()).filter(c => c.length > 0))
      ));
      const allDiscretionTypes = Array.from(new Set(
        sortedGroup.flatMap(p => (p.discretion_type || '').split(';').map(d => d.trim()).filter(d => d.length > 0))
      ));

      // Use the first item as the base, but aggregate the paragraphs and metadata
      const aggregatedItem = {
        ...sortedGroup[0],
        heading: displayHeading,
        management_domain: allDomains.join(';'),
        mgmt_d_keyword: allKeywords.join('; '),
        iucn_threat: allIucnThreats.join(';'),
        clause_type: allClauseTypes.join(';'),
        discretion_type: allDiscretionTypes.join(';'),
        paragraph: sortedGroup
          .map(item => item.paragraph)
          .filter(p => p && p.trim())
          .join('\n\n'),
        paragraphBlocks: sortedGroup.map(p => ({
          heading: p.heading,
          text: p.paragraph,
          mgmt_d_keyword: p.mgmt_d_keyword,
          management_domain: p.management_domain,
          clause_type: p.clause_type,
          clause_type_keyword: p.clause_type_keyword
        }))
      };
      
      return aggregatedItem;
    });
    
    // If a domain is selected but no act/regulation, sort by legislation keyword match count
    const isDomainOnlySelected = activeDomain !== 'All' && selectedActName === 'All' && selectedLegislationName === 'All';
    if (isDomainOnlySelected) {
      // Group by legislation and count keyword matches
      const legislationGroups = new Map<number, { items: typeof groupedArray, count: number }>();
      groupedArray.forEach(item => {
        if (!legislationGroups.has(item.legislation_id)) {
          legislationGroups.set(item.legislation_id, { items: [], count: 0 });
        }
        const group = legislationGroups.get(item.legislation_id)!;
        group.items.push(item);
        // Count non-empty management domain keywords for this item
        const keywordCount = (item.mgmt_d_keyword || '')
          .split(';')
          .map(k => k.trim())
          .filter(k => k.length > 0).length;
        group.count += keywordCount;
      });

      // Sort legislations by keyword count descending, then flatten
      const sortedLegislations = Array.from(legislationGroups.entries())
        .sort((a, b) => b[1].count - a[1].count);
      
      return sortedLegislations.flatMap(([_, group]) => group.items);
    }
    
    // Sort the grouped items by section number (numeric sections treated as numbers, ascending)
    groupedArray.sort((a, b) => {
      const aParsed = parseSectionForSort(a.section);
      const bParsed = parseSectionForSort(b.section);
      
      // Both numeric: compare as numbers
      if (aParsed.isNumeric && bParsed.isNumeric) {
        return (aParsed.value as number) - (bParsed.value as number);
      }
      
      // One numeric, one not: numeric comes first
      if (aParsed.isNumeric) return -1;
      if (bParsed.isNumeric) return 1;
      
      // Both non-numeric: compare as strings
      return String(aParsed.value).localeCompare(String(bParsed.value));
    });
    
    return groupedArray;
  }, [items, activeDomain, selectedActName, selectedLegislationName]);

  const allExpanded = groupedItems.length > 0 && expandedItems.size === groupedItems.length;
  const showHeadingAsTitle = (selectedActName && selectedActName !== 'All') || (selectedLegislationName && selectedLegislationName !== 'All');
  const getLegislationDisplayName = (item: LegislationItem) => {
    const type = (item.legislation_type || '').toLowerCase();
    const isAct = type.includes('act');
    if (!isAct && item.legislation_name && item.legislation_name.trim()) {
      return item.legislation_name;
    }
    if (item.act_name && item.act_name.trim()) {
      return item.act_name;
    }
    return item.legislation_name || '';
  };

  const handleExpandAll = () => {
    if (allExpanded) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(groupedItems.map((_, idx) => idx)));
    }
  };

  // Check if no domain and no act/regulation are selected AND no search term
  const noFiltersSelected = activeDomain === 'All' && selectedActName === 'All' && selectedLegislationName === 'All' && !searchTerm;

  if (noFiltersSelected) {
    return (
      <div className="py-16 text-center bg-gray-300 rounded border border-gray-400">
        <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p className="text-gray-700 font-bold text-sm mb-2">Select a Starting Point</p>
        <p className="text-gray-600 text-xs">Choose a Management Domain, an Act, or enter a search term to view sections and paragraphs.</p>
      </div>
    );
  }

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
      {groupedItems.map((item, idx) => {
        // Determine discretion indicators
        const discretionTypes = (item.discretion_type || '').split(';').map(d => d.trim().toLowerCase()).filter(d => d.length > 0);
        const hasMandatory = discretionTypes.some(d => d === 'mandatory');
        const hasDiscretionary = discretionTypes.some(d => d === 'discretionary');
        
        return (
        <div key={idx} className="bg-white rounded border border-gray-200 p-3 hover:shadow-md transition-all relative" style={{ borderLeftColor: JURISDICTION_COLORS[item.jurisdiction], borderLeftWidth: '3px' }}>
          {/* Discretion Stars - positioned in bottom right */}
          {(hasMandatory || hasDiscretionary) && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {hasMandatory && (
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20" title="Mandatory language">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              {hasDiscretionary && (
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" title="Discretionary language">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
          )}
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
                      keywords={filterKeywordsByDomain(item.mgmt_d_keyword || '', item.paragraph || item.heading, activeDomain)}
                    />
                  ) : (
                    <Highlight text={item.heading} term={searchTerm} />
                  )}
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold text-gray-800 truncate">
                    <Highlight text={getLegislationDisplayName(item)} term={searchTerm} />
                  </div>
                  <div className="text-[11px] text-gray-600 truncate">
                    {shouldHighlightKeywords ? (
                      <KeywordHighlight 
                        text={item.heading} 
                        keywords={filterKeywordsByDomain(item.mgmt_d_keyword || '', item.paragraph || item.heading, activeDomain)}
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
                let lastHeading = '';
                const shouldUnderlineClause = selectedClauseType && selectedClauseType !== 'All';
                return ((item as any).paragraphBlocks || [{ heading: item.heading, text: item.paragraph, mgmt_d_keyword: item.mgmt_d_keyword, management_domain: item.management_domain, clause_type: item.clause_type, clause_type_keyword: item.clause_type_keyword }]).map((block: any, blockIdx: number) => {
                  const headingTextRaw = block.heading || '';
                  const headingText = headingTextRaw.trim();
                  let paraText = block.text || "Text summary unavailable";
                  // Only highlight keywords if this paragraph's domain matches the selected domain
                  const blockDomain = block.management_domain || '';
                  const domainMatch = activeDomain === 'All' || blockDomain === activeDomain;
                  
                  // Use filterKeywordsByDomain to get only keywords for the active domain
                  const blockKeywords = domainMatch 
                    ? filterKeywordsByDomain(block.mgmt_d_keyword || '', paraText, activeDomain)
                    : [];
                  
                  // Clause type underlining: only underline if this paragraph's clause type matches
                  const blockClauseType = block.clause_type || '';
                  const blockClauseTypes = blockClauseType.split(';').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
                  const clauseMatch = shouldUnderlineClause && blockClauseTypes.some((t: string) => t.toLowerCase() === selectedClauseType.toLowerCase());
                  const clauseKeywords = clauseMatch ? (block.clause_type_keyword || '').split(';').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : [];
                  
                  // Show heading if it's different from the last one
                  const showHeading = headingText && headingText !== lastHeading;
                  if (headingText) lastHeading = headingText;
                  
                  return (
                    <div key={blockIdx} className="whitespace-pre-line text-[11px] text-gray-600 leading-tight">
                      {showHeading && (
                        <div className="text-[10px] font-semibold text-gray-700 mb-0.5 mt-1">{headingText}</div>
                      )}
                      {/* Apply highlights and underlines appropriately */}
                      {shouldHighlightKeywords && blockKeywords.length > 0 && clauseKeywords.length > 0 ? (
                        // Both management domain and clause keywords present - need combined rendering
                        // For simplicity, show clause underline on top of domain highlight
                        <ClauseKeywordUnderline 
                          text={paraText} 
                          keywords={clauseKeywords}
                        />
                      ) : shouldHighlightKeywords && blockKeywords.length > 0 ? (
                        <KeywordHighlight 
                          text={paraText} 
                          keywords={blockKeywords}
                        />
                      ) : clauseKeywords.length > 0 ? (
                        <ClauseKeywordUnderline 
                          text={paraText} 
                          keywords={clauseKeywords}
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
            {item.management_domain && item.management_domain.split(/[;,]/).filter((s: string) => s.trim()).map((domain: string, i: number) => (
              <span key={`domain-${i}`} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">{domain.trim()}</span>
            ))}
            {item.iucn_threat && item.iucn_threat.split(/[;,]/).filter((s: string) => s.trim()).map((threat: string, i: number) => (
              <span key={`threat-${i}`} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">{threat.trim()}</span>
            ))}
            {item.clause_type && item.clause_type.split(';').filter((s: string) => s.trim()).map((type: string, i: number) => (
              <span key={`type-${i}`} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">{type.trim()}</span>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default React.memo(LegislationList);
