
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { LegislationItem, FilterState, FilterOption, AppTab } from './types';
import { MANAGEMENT_DOMAINS } from './constants';
import Sidebar from './components/Sidebar';
import Filters from './components/Filters';
import Visualizations from './components/Visualizations';
import LegislationList from './components/LegislationList';

const StatCard: React.FC<{ label: string; value: string | number; color: string; isText?: boolean }> = ({ label, value, color, isText }) => (
  <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col transition-all hover:shadow-md">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{label}</span>
    <span className={`text-xl font-black truncate ${isText ? 'text-gray-800' : `text-${color}-600`}`}>{value}</span>
  </div>
);

const App: React.FC = () => {
  const [data, setData] = useState<LegislationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    jurisdiction: 'All',
    managementDomain: 'All',
    searchTerm: '',
    actName: 'All',
    legislationName: 'All'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./data.xlsx', { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`Data file (data.xlsx) could not be loaded. Status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json<LegislationItem>(workbook.Sheets[sheetName]);
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error('The data file is empty or formatted incorrectly.');
        }
        
        setData(jsonData);
      } catch (err: any) {
        console.error('Failed to load LAPSE data:', err);
        setError(err.message || 'An unexpected error occurred while loading data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    const term = filters.searchTerm.toLowerCase();
    return data.filter(item => {
      const jMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const dMatch = filters.managementDomain === 'All' || item.management_domain === filters.managementDomain;
      const aMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const lMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      const sMatch = !term || 
        `${item.act_name} ${item.legislation_name} ${item.heading} ${item.aggregate_paragraph}`.toLowerCase().includes(term);
      return jMatch && dMatch && aMatch && lMatch && sMatch;
    });
  }, [filters, data]);

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
    setAiSummary(null);
  }, []);

  const handleAiSummary = async () => {
    if (filteredData.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Provide a concise 3-paragraph conservation policy summary for: ${filters.managementDomain} (${filters.jurisdiction}). Number of records: ${filteredData.length}. Highlight key legislative tools for Pacific Salmon ecosystems.`;
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt 
      });
      setAiSummary(response.text || "Summary analysis could not be generated.");
    } catch (err) {
      console.error('AI Summary Error:', err);
      setAiSummary("Insight engine currently unavailable. Please try again later.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white font-black">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="tracking-widest uppercase text-xs animate-pulse">Initializing LAPSE Portal...</div>
    </div>
  );
  
  if (error) return (
    <div className="h-screen flex items-center justify-center bg-red-50 p-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-lg text-center">
        <h2 className="text-red-600 font-black text-xl mb-2">SYSTEM ERROR</h2>
        <p className="text-gray-600 mb-6 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold">Retry Connection</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 transform scale-100 transition-transform">
            <h2 className="text-2xl font-black mb-4 tracking-tight">Research Environment</h2>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              LAPSE (Legislation of Pacific Salmon Ecosystems) is a synthesized dataset for academic and conservation research. 
              Text summaries are derived from statutory language but do not replace legal counsel or official government gazettes.
            </p>
            <button 
              onClick={() => setShowDisclaimer(false)} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-inner">L</div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase leading-none">LAPSE Dashboard</h1>
            <p className="text-[9px] text-blue-400 font-bold tracking-widest leading-none mt-1">Policy Mapping for Pacific Salmon</p>
          </div>
        </div>
        <div className="flex bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('explorer')} 
            className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${activeTab === 'explorer' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Explorer
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-[64px] overflow-hidden">
        <Sidebar activeDomain={filters.managementDomain} onDomainSelect={(d) => handleFilterChange('managementDomain', d)} />

        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <Filters 
              filters={filters} 
              acts={availableActs} 
              legislations={availableLegislation} 
              onFilterChange={handleFilterChange} 
              onReset={() => setFilters({jurisdiction: 'All', managementDomain: 'All', searchTerm: '', actName: 'All', legislationName: 'All'})} 
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Matches Found" value={filteredData.length} color="blue" />
              <StatCard label="Federal Acts" value={filteredData.filter(d => d.jurisdiction === 'Federal').length} color="blue" />
              <StatCard label="Provincial Acts" value={filteredData.filter(d => d.jurisdiction === 'Provincial').length} color="blue" />
              <StatCard label="Active Filter" value={filters.managementDomain === 'All' ? 'General' : filters.managementDomain} color="gray" isText />
            </div>

            {activeTab === 'dashboard' ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <Visualizations data={filteredData} />
                <div className="bg-white rounded-3xl border border-blue-50 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-600 rounded-full mr-2"></span>
                        AI Insight Synthesis
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">Large Language Model summary of active legislative filters</p>
                    </div>
                    <button 
                      onClick={handleAiSummary} 
                      disabled={isGeneratingSummary || filteredData.length === 0} 
                      className={`px-6 py-2 rounded-xl font-black text-xs transition-all ${
                        isGeneratingSummary ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {isGeneratingSummary ? 'ANALYZING DATA...' : 'GENERATE SUMMARY'}
                    </button>
                  </div>
                  {aiSummary ? (
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in duration-700">{aiSummary}</div>
                  ) : (
                    <div className="py-10 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Click generate to synthesize domain specific insights</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-2 duration-500">
                <LegislationList items={filteredData} searchTerm={filters.searchTerm} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
