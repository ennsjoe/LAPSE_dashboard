
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { LegislationItem, FilterState, FilterOption } from './types';
import { MANAGEMENT_DOMAINS, JURISDICTIONS } from './constants';
import Sidebar from './components/Sidebar';
import Filters from './components/Filters';
import Visualizations from './components/Visualizations';
import LegislationList from './components/LegislationList';

const App: React.FC = () => {
  const [data, setData] = useState<LegislationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    jurisdiction: 'All',
    managementDomain: 'All',
    searchTerm: '',
    actName: 'All',
    legislationName: 'All'
  });

  // Load Data (Try Excel first, then CSV)
  useEffect(() => {
    const loadData = async () => {
      try {
        let response = await fetch('./data.xlsx');
        
        // If Excel file doesn't exist, fall back to CSV
        if (!response.ok) {
          console.warn('data.xlsx not found, attempting to load data.csv...');
          response = await fetch('./data.csv');
        }

        if (!response.ok) {
          throw new Error('Could not load data.xlsx or data.csv. Please ensure one of these files exists in the root directory.');
        }
        
        // Get the response as an ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        
        // Parse the workbook (Works for both .xlsx and .csv)
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<LegislationItem>(worksheet);
        
        if (!jsonData || jsonData.length === 0) {
           throw new Error('Data file parsed successfully but contained no records.');
        }

        setData(jsonData);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error reading data file:", err);
        setError(err.message || "Failed to load data");
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter logic for the main list
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchJurisdiction = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const matchDomain = filters.managementDomain === 'All' || item.management_domain === filters.managementDomain;
      const matchAct = filters.actName === 'All' || item.act_name === filters.actName;
      const matchLegislation = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      
      const searchStr = filters.searchTerm.toLowerCase().trim();
      
      // Search logic restricted to aggregate_keywords column
      // Fallback to aggregate_paragraph if aggregate_keywords is missing (e.g., in CSV mode)
      const targetText = item.aggregate_keywords || item.aggregate_paragraph || "";
      const matchSearch = !searchStr || String(targetText).toLowerCase().includes(searchStr);

      return matchJurisdiction && matchDomain && matchAct && matchLegislation && matchSearch;
    });
  }, [filters, data]);

  // Derived data for dropdowns (Filtered by Domain and Jurisdiction)
  const dropdownContextData = useMemo(() => {
    return data.filter(item => {
      const matchDomain = filters.managementDomain === 'All' || item.management_domain === filters.managementDomain;
      const matchJurisdiction = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      return matchDomain && matchJurisdiction;
    });
  }, [data, filters.managementDomain, filters.jurisdiction]);

  const availableActs = useMemo<FilterOption[]>(() => {
    const counts: Record<string, number> = {};
    dropdownContextData.forEach(d => {
      if (d.act_name) {
        counts[d.act_name] = (counts[d.act_name] || 0) + 1;
      }
    });

    const options = Object.entries(counts).map(([name, count]) => ({ name, count }));
    options.sort((a, b) => a.name.localeCompare(b.name));

    return [{ name: 'All', count: dropdownContextData.length }, ...options];
  }, [dropdownContextData]);

  const availableLegislation = useMemo<FilterOption[]>(() => {
    const context = filters.actName === 'All' 
      ? dropdownContextData 
      : dropdownContextData.filter(d => d.act_name === filters.actName);
      
    const counts: Record<string, number> = {};
    context.forEach(d => {
      if (d.legislation_name) {
        counts[d.legislation_name] = (counts[d.legislation_name] || 0) + 1;
      }
    });

    const options = Object.entries(counts).map(([name, count]) => ({ name, count }));
    options.sort((a, b) => a.name.localeCompare(b.name));

    return [{ name: 'All', count: context.length }, ...options];
  }, [dropdownContextData, filters.actName]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      
      // Reset downstream filters if an upstream filter changes
      if (key === 'actName') {
        next.legislationName = 'All';
      }
      
      // Reset Act and Legislation if Domain or Jurisdiction changes
      if (key === 'managementDomain' || key === 'jurisdiction') {
        next.actName = 'All';
        next.legislationName = 'All';
      }
      
      return next;
    });
  };

  const resetFilters = () => {
    setFilters({
      jurisdiction: 'All',
      managementDomain: 'All',
      searchTerm: '',
      actName: 'All',
      legislationName: 'All'
    });
  };

  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Data");
    XLSX.writeFile(wb, "lapse_dashboard_data.xlsx");
  };

  const isListVisible = filters.actName !== 'All' || filters.legislationName !== 'All' || filters.searchTerm.trim() !== '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium tracking-wide">Loading LAPSE Dashboard Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-8 shadow-sm text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 md:p-8 transform transition-all scale-100 border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-3 rounded-full mb-4 ring-8 ring-amber-50">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Disclaimer</h2>
              <div className="text-gray-600 text-sm leading-relaxed mb-8 space-y-3">
                <p>None of the information presented in LAPSE qualifies as legal advice.</p>
                <p>The authors are aquatic biologists with limited legal training. This tool is intended for research and informational purposes only.</p>
                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">
                  Always consult official government sources and qualified legal professionals for authoritative legal interpretation.
                </p>
              </div>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-sm"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Header */}
      <header className="bg-gray-900 text-white px-6 py-4 shadow-lg z-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg">
             {/* Replaced Caution Icon with Shield (Protection/Legislation) */}
             <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest leading-none">LAPSE DASHBOARD</h1>
            <p className="text-xs text-blue-300 font-medium mt-1">Legislation Applicable to Pacific Salmon and Ecosystems</p>
          </div>
        </div>
        
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded-lg border border-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Download Data
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeDomain={filters.managementDomain} 
          onDomainSelect={(domain) => handleFilterChange('managementDomain', domain)} 
        />

        <main className="flex-1 flex flex-col min-w-0 bg-gray-50 relative">
          {/* Filter Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm z-10">
            <Filters 
              filters={filters} 
              acts={availableActs}
              legislations={availableLegislation}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Getting Started</h2>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-4xl">
                    Select a Management Domain on the left or use the filters above to explore legislation. 
                    Sections expand to show full text with keyword highlighting. 
                    <span className="text-red-600 font-medium"> Domain keywords</span> and 
                    <span className="text-blue-600 font-medium"> clause type keywords</span> are color-coded.
                  </p>
                </div>
              </div>
            </section>

            <Visualizations data={filteredData} />

            <section className="space-y-4 pb-8">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="text-xl font-bold text-gray-800">
                  Sections and Paragraphs
                </h3>
                {isListVisible && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {filteredData.length} matches
                  </span>
                )}
              </div>
              
              {isListVisible ? (
                <LegislationList items={filteredData} searchTerm={filters.searchTerm} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                  <p className="text-lg">Please select an Act or enter a search term to view sections.</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
