import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { LegislationItem, FilterState, FilterOption } from './types';
import { MANAGEMENT_DOMAINS } from './constants';

// ============================================================================
// SHINY-MATCHING COLOR CONSTANTS
// ============================================================================
const SHINY_COLORS = {
  federal: '#996666',
  provincial: '#668899',
  federalHover: '#aa7777',
  provincialHover: '#7799aa',
  allJurisdiction: '#cccccc',
  darkText: '#2c3e50',
  buttonDark: '#2c3e50',
  disclaimerBg: '#fff3cd',
  disclaimerBorder: '#ffc107',
  infoBarBg: '#e8f4f8',
  infoBarBorder: '#668899',
  linkButton: '#0074D9',
  highlightSearch: '#ffff00',
};

// ============================================================================
// PERFORMANCE: ITEMS PER PAGE
// ============================================================================
const ITEMS_PER_PAGE = 50;

// ============================================================================
// CUSTOM HOOK: DEBOUNCED VALUE
// ============================================================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// DISCLAIMER BAR COMPONENT (Memoized)
// ============================================================================
const DisclaimerBar = memo(() => (
  <div 
    className="flex items-start gap-3 px-5 py-3 mb-5 rounded"
    style={{ 
      backgroundColor: SHINY_COLORS.disclaimerBg, 
      border: `1px solid ${SHINY_COLORS.disclaimerBorder}`,
      borderLeft: `4px solid ${SHINY_COLORS.federal}`
    }}
  >
    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: SHINY_COLORS.federal }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <p className="text-sm leading-relaxed" style={{ color: '#664d03' }}>
      <strong style={{ color: SHINY_COLORS.federal }}>Disclaimer:</strong> None of the information presented in LAPSE qualifies as legal advice. 
      The authors are aquatic biologists with limited legal training. 
      This tool is intended for research and informational purposes only. 
      Always consult official government sources and qualified legal professionals for authoritative legal interpretation.
    </p>
  </div>
));

// ============================================================================
// DATA INFO BAR COMPONENT (Memoized)
// ============================================================================
interface DataInfoBarProps {
  lastProcessed: string;
  statuteCount: number;
}

const DataInfoBar = memo<DataInfoBarProps>(({ lastProcessed, statuteCount }) => (
  <div 
    className="flex items-center gap-6 flex-wrap px-5 py-2.5 mb-5 rounded text-sm"
    style={{ 
      backgroundColor: SHINY_COLORS.infoBarBg, 
      border: `1px solid ${SHINY_COLORS.infoBarBorder}`,
      borderLeft: `4px solid ${SHINY_COLORS.infoBarBorder}`,
      color: SHINY_COLORS.darkText
    }}
  >
    <div className="flex items-center gap-1.5">
      <svg className="w-4 h-4" style={{ color: SHINY_COLORS.provincial }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
      </svg>
      <strong style={{ color: SHINY_COLORS.provincial }}>Data Last Processed:</strong>
      <span>{lastProcessed}</span>
    </div>
    <div className="flex items-center gap-1.5">
      <svg className="w-4 h-4" style={{ color: SHINY_COLORS.provincial }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <strong style={{ color: SHINY_COLORS.provincial }}>Statutes in Database:</strong>
      <span>{statuteCount}</span>
    </div>
    <span className="italic text-gray-500 text-xs">
      Date stamps (Current To) are shown for individual statutes from time of download from government websites
    </span>
  </div>
));

// ============================================================================
// SIDEBAR COMPONENT (Memoized)
// ============================================================================
interface SidebarProps {
  activeDomain: string;
  onDomainSelect: (domain: string) => void;
}

const Sidebar = memo<SidebarProps>(({ activeDomain, onDomainSelect }) => {
  return (
    <aside className="w-72 flex-shrink-0 flex flex-col border-r border-gray-200" style={{ backgroundColor: '#2c3e50' }}>
      <div className="p-4 border-b" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(0, 0, 0, 0.3)' }}>
        <h4 className="text-sm font-semibold" style={{ color: '#ffffff' }}>Management Domains</h4>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <button
          onClick={() => onDomainSelect('All')}
          className={`w-full text-left px-3 py-2 mb-1 rounded text-sm flex items-center gap-2 transition-all ${
            activeDomain === 'All' ? 'font-semibold' : 'hover:bg-blue-600 hover:bg-opacity-40'
          }`}
          style={{ 
            color: '#ffffff',
            backgroundColor: activeDomain === 'All' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          All
        </button>
        
        <hr className="my-2" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }} />
        
        {MANAGEMENT_DOMAINS.filter(d => d !== 'All').map((domain) => (
          <button
            key={domain}
            onClick={() => onDomainSelect(domain)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
              activeDomain === domain 
                ? 'font-semibold' 
                : 'hover:bg-blue-600 hover:bg-opacity-40'
            }`}
            style={{ 
              color: '#ffffff',
              backgroundColor: activeDomain === domain ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            {domain}
          </button>
        ))}
      </nav>
    </aside>
  );
});

// ============================================================================
// SEARCH HIGHLIGHT COMPONENT (Memoized)
// ============================================================================
const Highlight = memo<{ text: string; term: string }>(({ text, term }) => {
  if (!term || !text) return <>{text}</>;
  try {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() 
            ? <span key={i} className="font-bold px-0.5 rounded" style={{ backgroundColor: SHINY_COLORS.highlightSearch }}>{part}</span> 
            : part
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
});

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT (Memoized)
// ============================================================================
interface CollapsibleSectionProps {
  section: string;
  heading: string;
  paragraphText: string;
  jurisdiction: string;
  actName: string;
  legislationName: string;
  searchTerm?: string;
  currentToDate?: string;
  showFullLabel?: boolean;
}

const CollapsibleSection = memo<CollapsibleSectionProps>(({
  section, heading, paragraphText, jurisdiction, actName, legislationName, searchTerm, currentToDate, showFullLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const borderColor = jurisdiction === 'Federal' ? SHINY_COLORS.federal : SHINY_COLORS.provincial;

  const sectionLabel = showFullLabel 
    ? `${actName} (${jurisdiction}) | ${legislationName} - Section ${section}`
    : `Section ${section}`;

  return (
    <div 
      className="mb-3 rounded bg-white overflow-hidden transition-shadow hover:shadow-md"
      style={{ 
        border: '1px solid #ddd',
        borderLeft: `4px solid ${borderColor}`
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm" style={{ color: SHINY_COLORS.darkText }}>
            {sectionLabel}
          </span>
          {heading && (
            <span className="text-sm text-gray-600 ml-2 truncate">- {heading}</span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {currentToDate && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
              Current to: {currentToDate}
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            <Highlight text={paragraphText || "No paragraph text available."} term={searchTerm || ''} />
          </p>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// VISUALIZATIONS COMPONENT (Memoized with lazy chart rendering)
// ============================================================================
interface VisualizationsProps {
  data: LegislationItem[];
}

const Visualizations = memo<VisualizationsProps>(({ data }) => {
  const [activeTab, setActiveTab] = useState<'keywords' | 'iucn' | 'clauses'>('keywords');

  // Only compute chart data when the tab is active
  const keywordFreqData = useMemo(() => {
    if (activeTab !== 'keywords') return [];
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const keywords = (item.management_domain_keywords?.split(';') || [])
        .map(k => k.trim())
        .filter(k => k.length > 2);
      keywords.forEach(k => counts[k] = (counts[k] || 0) + 1);
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, activeTab]);

  const iucnData = useMemo(() => {
    if (activeTab !== 'iucn') return [];
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const label = item.iucn_threat || "Unspecified";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data, activeTab]);

  const actionableClauses = useMemo(() => {
    if (activeTab !== 'clauses') return [];
    return data
      .filter(item => item.clause_type && item.clause_type.toLowerCase().includes('regulat'))
      .slice(0, 20)
      .map(item => ({
        actName: item.act_name,
        section: item.section,
        heading: item.heading,
        jurisdiction: item.jurisdiction,
        clauseType: item.clause_type
      }));
  }, [data, activeTab]);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 bg-gray-50 rounded border-2 border-dashed border-gray-200">
        No data to visualize.
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-gray-200">
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('keywords')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'keywords' 
              ? 'border-b-2 bg-gray-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          style={activeTab === 'keywords' ? { borderBottomColor: SHINY_COLORS.darkText, color: SHINY_COLORS.darkText } : {}}
        >
          Keyword Frequency
        </button>
        <button 
          onClick={() => setActiveTab('iucn')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'iucn' 
              ? 'border-b-2 bg-gray-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          style={activeTab === 'iucn' ? { borderBottomColor: SHINY_COLORS.darkText, color: SHINY_COLORS.darkText } : {}}
        >
          IUCN Threats
        </button>
        <button 
          onClick={() => setActiveTab('clauses')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'clauses' 
              ? 'border-b-2 bg-gray-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          style={activeTab === 'clauses' ? { borderBottomColor: SHINY_COLORS.darkText, color: SHINY_COLORS.darkText } : {}}
        >
          Actionable Clauses
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'keywords' && (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordFreqData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120} 
                  tick={{ fontSize: 11, fill: '#4b5563' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill={SHINY_COLORS.darkText} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'iucn' && (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={iucnData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  tick={{ fontSize: 11, fill: '#4b5563' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill={SHINY_COLORS.darkText} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'clauses' && (
          <div className="max-h-96 overflow-y-auto">
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Implementation instruments from Acts filtered by current selections
            </p>
            {actionableClauses.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No actionable clauses match the current filters.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold mb-2" style={{ color: SHINY_COLORS.darkText }}>
                  Showing {actionableClauses.length} actionable clause(s)
                </p>
                {actionableClauses.map((clause, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded bg-gray-50 transition-shadow hover:shadow-md"
                    style={{ 
                      border: '1px solid #ddd',
                      borderLeft: `4px solid ${clause.jurisdiction === 'Federal' ? SHINY_COLORS.federal : SHINY_COLORS.provincial}`
                    }}
                  >
                    <div className="font-semibold text-sm mb-1" style={{ color: SHINY_COLORS.darkText }}>
                      {clause.actName} - Section {clause.section}
                    </div>
                    {clause.heading && (
                      <div className="text-sm italic text-gray-600 mb-2">{clause.heading}</div>
                    )}
                    {clause.clauseType && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                        </svg>
                        {clause.clauseType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
const App: React.FC = () => {
  const [data, setData] = useState<LegislationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  
  // PERFORMANCE: Pagination state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    jurisdiction: 'All',
    managementDomain: 'All',
    searchTerm: '',
    actName: 'All',
    legislationName: 'All'
  });

  // PERFORMANCE: Debounce search term (300ms delay)
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters.jurisdiction, filters.managementDomain, filters.actName, filters.legislationName, debouncedSearchTerm]);

  const resetFilters = useCallback(() => {
    setFilters({
      jurisdiction: 'All',
      managementDomain: 'All',
      searchTerm: '',
      actName: 'All',
      legislationName: 'All'
    });
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const addDiag = useCallback((msg: string) => {
    setDiagnostics(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const processWorkbook = useCallback((workbook: XLSX.WorkBook) => {
    const sheetName = workbook.SheetNames[0];
    addDiag(`Reading sheet: "${sheetName}"`);
    const jsonData = XLSX.utils.sheet_to_json<LegislationItem>(workbook.Sheets[sheetName]);
    
    if (jsonData && jsonData.length > 0) {
      addDiag(`Successfully parsed ${jsonData.length} records.`);
      setData(jsonData);
      setError(null);
      setIsLoading(false);
      return true;
    }
    addDiag(`Warning: Sheet "${sheetName}" appears to be empty.`);
    return false;
  }, [addDiag]);

  // PERFORMANCE: Simplified single-path data loading
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setDiagnostics([]);
    
    addDiag("Loading data...");

    try {
      const response = await fetch('LAPSE_compendium.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const jsonData: LegislationItem[] = await response.json();
      
      if (jsonData && jsonData.length > 0) {
        addDiag(`Loaded ${jsonData.length} records.`);
        setData(jsonData);
        setError(null);
      } else {
        throw new Error("Empty dataset");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addDiag(`Error: ${errorMessage}`);
      setError("DATA_NOT_FOUND");
    } finally {
      setIsLoading(false);
    }
  }, [addDiag]);

  useEffect(() => {
    loadData();
  }, []);

  const handleManualUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addDiag(`Manual upload: ${file.name}`);
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        if (!processWorkbook(workbook)) {
          setError("INVALID_FILE_FORMAT");
          setIsLoading(false);
        }
      } catch (err) {
        addDiag(`Upload Error: ${err}`);
        setError("UPLOAD_FAILED");
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  }, [addDiag, processWorkbook]);

  // PERFORMANCE: Use debounced search term for filtering
  const filteredData = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    return data.filter(item => {
      const jMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const dMatch = filters.managementDomain === 'All' || item.management_domain === filters.managementDomain;
      const aMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const lMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      const sMatch = !term || 
        `${item.act_name} ${item.legislation_name} ${item.heading} ${item.aggregate_paragraph}`.toLowerCase().includes(term);
      return jMatch && dMatch && aMatch && lMatch && sMatch;
    });
  }, [filters.jurisdiction, filters.managementDomain, filters.actName, filters.legislationName, debouncedSearchTerm, data]);

  // PERFORMANCE: Only render visible items
  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  const hasMore = visibleCount < filteredData.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  }, []);

  const availableActs = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => 
      (filters.managementDomain === 'All' || item.management_domain === filters.managementDomain) &&
      (filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction)
    );
    const counts: Record<string, number> = {};
    context.forEach(d => { if (d.act_name) counts[d.act_name] = (counts[d.act_name] || 0) + 1; });
    return [{ name: 'All', count: context.length }, ...Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))];
  }, [data, filters.managementDomain, filters.jurisdiction]);

  const availableLegislation = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => 
      (filters.managementDomain === 'All' || item.management_domain === filters.managementDomain) &&
      (filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction) &&
      (filters.actName === 'All' || item.act_name === filters.actName)
    );
    const counts: Record<string, number> = {};
    context.forEach(d => { if (d.legislation_name) counts[d.legislation_name] = (counts[d.legislation_name] || 0) + 1; });
    return [{ name: 'All', count: context.length }, ...Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))];
  }, [data, filters.managementDomain, filters.jurisdiction, filters.actName]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'actName' ? { legislationName: 'All' } : {}),
      ...((key === 'managementDomain' || key === 'jurisdiction') ? { actName: 'All', legislationName: 'All' } : {})
    }));
  }, []);

  // Memoize statute count
  const statuteCount = useMemo(() => {
    return new Set(data.map(d => d.legislation_name)).size;
  }, [data]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-sm text-gray-600">Loading LAPSE Dashboard...</div>
      <div className="mt-6 bg-white p-4 rounded border border-gray-200 w-full max-w-sm text-left">
        <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Activity Log</p>
        {diagnostics.slice(-3).map((d, i) => (
          <p key={i} className="text-xs text-gray-400 font-mono truncate">{d}</p>
        ))}
      </div>
    </div>
  );
  
  // ============================================================================
  // ERROR STATE
  // ============================================================================
  if (error) return (
    <div className="h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 max-w-lg w-full">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Data Access Error</h2>
        <p className="text-gray-500 mb-6 text-center text-sm">
          The legislative dataset could not be loaded.
        </p>
        
        <div className="flex gap-3 mb-6">
          <button 
            onClick={loadData} 
            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded font-medium text-sm transition-colors"
          >
            Retry
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-1 text-white px-4 py-3 rounded font-medium text-sm transition-colors"
            style={{ backgroundColor: SHINY_COLORS.provincial }}
          >
            Upload File
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.csv,.json" onChange={handleManualUpload} />
        </div>

        <div className="bg-gray-50 rounded p-4 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Log</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {diagnostics.map((diag, i) => (
              <p key={i} className="text-xs text-gray-400 font-mono">{diag}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold" style={{ color: SHINY_COLORS.darkText }}>
          Legislation Applicable to Pacific Salmon and Ecosystems (LAPSE)
        </h1>
      </header>

      {/* DISCLAIMER & INFO BARS */}
      <div className="px-6 pt-4 flex-shrink-0 bg-gray-50">
        <DisclaimerBar />
        <DataInfoBar lastProcessed="2025-01-14" statuteCount={statuteCount} />
        
        {/* About Button */}
        <div className="mb-4">
          <a
            href="https://ennsjoe.github.io/salmon_management_domains_compendium/LAPSE-Dashboard-About.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 text-white font-semibold rounded text-sm transition-colors"
            style={{ backgroundColor: SHINY_COLORS.federal }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = SHINY_COLORS.federalHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = SHINY_COLORS.federal}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            About LAPSE Dashboard
          </a>
        </div>
      </div>

      {/* MAIN THREE-COLUMN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <Sidebar 
          activeDomain={filters.managementDomain} 
          onDomainSelect={(d) => handleFilterChange('managementDomain', d)} 
        />

        {/* CENTER PANEL */}
        <main className="flex-1 flex flex-col bg-white border-r border-gray-200 overflow-hidden min-w-0">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            {/* Search */}
            <h4 className="text-sm font-semibold mb-3" style={{ color: SHINY_COLORS.darkText }}>Search Legislation</h4>
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Enter word or phrase to search..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={() => handleFilterChange('searchTerm', '')}
                className="p-2 text-white rounded transition-colors"
                style={{ backgroundColor: SHINY_COLORS.buttonDark }}
                title="Clear Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/>
                </svg>
              </button>
            </div>

            {/* Jurisdiction Toggle */}
            <h4 className="text-sm font-semibold mb-3" style={{ color: SHINY_COLORS.darkText }}>Filter by Jurisdiction</h4>
            <div className="flex items-center gap-0 mb-4">
              <button
                onClick={() => handleFilterChange('jurisdiction', 'All')}
                className="px-4 py-2 text-sm font-medium rounded-l border transition-colors"
                style={{
                  backgroundColor: filters.jurisdiction === 'All' ? SHINY_COLORS.allJurisdiction : 'white',
                  borderColor: '#999999',
                  color: filters.jurisdiction === 'All' ? 'white' : '#666'
                }}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('jurisdiction', 'Federal')}
                className="px-4 py-2 text-sm font-medium border-t border-b transition-colors"
                style={{
                  backgroundColor: filters.jurisdiction === 'Federal' ? SHINY_COLORS.federal : 'white',
                  borderColor: filters.jurisdiction === 'Federal' ? '#773333' : '#999999',
                  color: filters.jurisdiction === 'Federal' ? 'white' : '#666'
                }}
              >
                Federal
              </button>
              <button
                onClick={() => handleFilterChange('jurisdiction', 'Provincial')}
                className="px-4 py-2 text-sm font-medium rounded-r border transition-colors"
                style={{
                  backgroundColor: filters.jurisdiction === 'Provincial' ? SHINY_COLORS.provincial : 'white',
                  borderColor: filters.jurisdiction === 'Provincial' ? '#446677' : '#999999',
                  color: filters.jurisdiction === 'Provincial' ? 'white' : '#666'
                }}
              >
                Provincial
              </button>
            </div>

            {/* Act/Regulation Dropdowns */}
            <h4 className="text-sm font-semibold mb-3" style={{ color: SHINY_COLORS.darkText }}>Select Legislation</h4>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Acts</label>
                <div className="flex gap-2">
                  <select 
                    value={filters.actName}
                    onChange={(e) => handleFilterChange('actName', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {availableActs.map(a => (
                      <option key={a.name} value={a.name}>
                        {a.name === 'All' ? '-- All Acts --' : a.name} ({a.count})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleFilterChange('actName', 'All')}
                    className="p-2 text-white rounded transition-colors"
                    style={{ backgroundColor: SHINY_COLORS.buttonDark }}
                    title="Reset to All Acts"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Regulations</label>
                <div className="flex gap-2">
                  <select 
                    value={filters.legislationName}
                    onChange={(e) => handleFilterChange('legislationName', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {availableLegislation.map(l => (
                      <option key={l.name} value={l.name}>
                        {l.name === 'All' ? '-- All Regulations --' : l.name} ({l.count})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleFilterChange('legislationName', 'All')}
                    className="p-2 text-white rounded transition-colors"
                    style={{ backgroundColor: SHINY_COLORS.buttonDark }}
                    title="Reset"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* View Full Legislation Link */}
            {filters.legislationName !== 'All' && (
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded transition-colors"
                  style={{ backgroundColor: SHINY_COLORS.linkButton }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  View Full Legislation
                </a>
              </div>
            )}
          </div>

          {/* Sections and Paragraphs - PAGINATED */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="text-sm font-semibold mb-3" style={{ color: SHINY_COLORS.darkText }}>
              Sections and Paragraphs
            </h4>
            
            {filteredData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {filters.actName === 'All' && !filters.searchTerm 
                  ? "Please select an Act or enter a search term to view sections."
                  : "No sections match your filters."}
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Showing {visibleData.length} of {filteredData.length} section(s)
                </p>
                
                {visibleData.map((item, idx) => (
                  <CollapsibleSection
                    key={`${item.legislation_name}-${item.section}-${idx}`}
                    section={item.section || 'N/A'}
                    heading={item.heading || 'No heading'}
                    paragraphText={item.aggregate_paragraph || ''}
                    jurisdiction={item.jurisdiction || 'Unknown'}
                    actName={item.act_name || ''}
                    legislationName={item.legislation_name || ''}
                    searchTerm={debouncedSearchTerm}
                    currentToDate={item.current_to_date}
                    showFullLabel={filters.actName === 'All' && !!debouncedSearchTerm}
                  />
                ))}
                
                {/* LOAD MORE BUTTON */}
                {hasMore && (
                  <div className="text-center py-4">
                    <button
                      onClick={loadMore}
                      className="px-6 py-3 text-white font-medium rounded transition-colors hover:opacity-90"
                      style={{ backgroundColor: SHINY_COLORS.provincial }}
                    >
                      Load More ({filteredData.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="w-[28rem] flex-shrink-0 overflow-y-auto p-4 bg-gray-50">
          <Visualizations data={filteredData} />
        </aside>
      </div>
    </div>
  );
};

export default App;