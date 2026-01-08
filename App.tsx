import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { LegislationItem, FilterState, FilterOption, AppTab } from './types';
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
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeployGuide, setShowDeployGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    jurisdiction: 'All',
    managementDomain: 'All',
    searchTerm: '',
    actName: 'All',
    legislationName: 'All'
  });

  const resetFilters = useCallback(() => {
    setFilters({
      jurisdiction: 'All',
      managementDomain: 'All',
      searchTerm: '',
      actName: 'All',
      legislationName: 'All'
    });
  }, []);

  const addDiag = (msg: string) => setDiagnostics(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const processWorkbook = (workbook: XLSX.WorkBook) => {
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
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setDiagnostics([]);
    
    addDiag("Starting automated data discovery...");

    const filesToTry = [
      'LAPSE_compendium.json',
      './LAPSE_compendium.json',
      '/LAPSE_compendium.json'
    ];
    
    let success = false;

    for (const filePath of filesToTry) {
      try {
        addDiag(`Attempting to fetch: ${filePath}`);
        const response = await fetch(filePath);
        
        if (!response.ok) {
          addDiag(`Failed: HTTP ${response.status} (${response.statusText})`);
          continue;
        }

        addDiag(`Success! Parsing JSON data...`);
        const jsonData: LegislationItem[] = await response.json();
        
        if (jsonData && jsonData.length > 0) {
          addDiag(`Successfully loaded ${jsonData.length} records.`);
          setData(jsonData);
          setError(null);
          setIsLoading(false);
          success = true;
          break;
        } else {
          addDiag(`Warning: JSON file appears to be empty.`);
        }
      } catch (err: any) {
        addDiag(`System Error: ${err.message || "Unknown Network Error"}`);
      }
    }

    if (!success) {
      addDiag("Data discovery failed for all paths.");
      setError("DATA_NOT_FOUND");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addDiag(`Manual upload initiated: ${file.name}`);
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
  };

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
  }, []);

  const handleExport = () => {
    if (filteredData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LAPSE_Filtered");
    XLSX.writeFile(workbook, `LAPSE_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white font-black text-center px-6">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="tracking-widest uppercase text-[10px] animate-pulse">Initializing LAPSE Portal...</div>
      <div className="mt-8 bg-gray-800 p-4 rounded-xl border border-gray-700 w-full max-w-sm text-left">
        <p className="text-[9px] text-blue-400 font-bold uppercase mb-2">Activity Monitor</p>
        {diagnostics.slice(-3).map((d, i) => (
          <p key={i} className="text-[9px] text-gray-400 font-mono truncate">{d}</p>
        ))}
      </div>
    </div>
  );
  
  if (error) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-6 md:p-10 overflow-y-auto">
      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-gray-100 max-w-2xl w-full my-auto">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-4 text-center uppercase tracking-tight">Data Access Error</h2>
        <p className="text-gray-500 mb-8 text-center text-sm leading-relaxed">
          The app is present, but the legislative dataset could not be parsed.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button onClick={loadData} className="bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95">
            Retry Connection
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95">
            Upload Manually
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.csv" onChange={handleManualUpload} />
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-inner">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Diagnostic Trace</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
            {diagnostics.map((diag, i) => (
              <p key={i} className="text-[10px] text-gray-400 font-mono leading-tight">{diag}</p>
            ))}
          </div>
        </div>
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
              Text summaries are derived from statutory language but do not replace legal counsel.
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

      {(showAbout || showDeployGuide) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAbout(false); setShowDeployGuide(false); }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-10 overflow-y-auto max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black tracking-tight">{showDeployGuide ? 'Deployment Guide' : 'About LAPSE'}</h2>
              <button onClick={() => { setShowAbout(false); setShowDeployGuide(false); }} className="text-gray-400 hover:text-black">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {showDeployGuide ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h3 className="font-black text-blue-900 text-sm uppercase mb-4">Steps to Fix GitHub Pages</h3>
                  <ol className="list-decimal pl-5 space-y-4 text-sm text-blue-800 font-medium">
                    <li>Open your repo on <strong>GitHub.com</strong>.</li>
                    <li>Navigate to <strong>Settings</strong> (top tab) &rarr; <strong>Pages</strong> (left bar).</li>
                    <li>Under <strong>Build and deployment &rarr; Source</strong>, ensure <strong>"Deploy from a branch"</strong> is active.</li>
                    <li>Set <strong>Branch</strong> to <span className="bg-blue-200 px-2 py-0.5 rounded">main</span> and <strong>Folder</strong> to <span className="bg-blue-200 px-2 py-0.5 rounded">/(root)</span>.</li>
                    <li>Click <strong>Save</strong>.</li>
                    <li>Wait 1 minute, then check the <strong>Actions</strong> tab. A deployment runner will appear automatically.</li>
                  </ol>
                </div>
                <button onClick={() => setShowDeployGuide(false)} className="w-full py-3 bg-gray-100 rounded-xl font-bold text-xs uppercase hover:bg-gray-200 transition-colors">Back to About</button>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p><strong>Version:</strong> 1.1.0-Production</p>
                <p>LAPSE provides a centralized interface for exploring the complex legislative landscape surrounding Pacific Salmon ecosystems in Canada and British Columbia.</p>
                <h4 className="font-bold text-gray-900 pt-2">Data Dictionary</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Management Domain:</strong> Policy category (e.g., Restoration, Pollution).</li>
                  <li><strong>IUCN Threat:</strong> Alignment with global biodiversity threat classifications.</li>
                  <li><strong>Clause Type:</strong> The legal nature of the text (Regulatory, Enabling, etc.).</li>
                </ul>
                <div className="flex gap-3 pt-6">
                  <button 
                    onClick={() => setShowDeployGuide(true)}
                    className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Deployment Help
                  </button>
                  <button 
                    onClick={() => setShowAbout(false)}
                    className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-inner cursor-pointer" onClick={() => window.location.reload()}>L</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight uppercase leading-none">LAPSE Dashboard</h1>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-bold text-green-400 uppercase tracking-tighter">System Live</span>
              </div>
            </div>
            <p className="text-[9px] text-blue-400 font-bold tracking-widest leading-none mt-1 uppercase">Pacific Salmon Policy Framework</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
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
          <button 
            onClick={() => setShowAbout(true)}
            className="text-gray-400 hover:text-white transition-all hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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
              onReset={resetFilters} 
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
              <StatCard label="Matches Found" value={filteredData.length} color="blue" />
              <StatCard label="Federal Jurisdiction" value={filteredData.filter(d => d.jurisdiction === 'Federal').length} color="blue" />
              <StatCard label="Provincial Jurisdiction" value={filteredData.filter(d => d.jurisdiction === 'Provincial').length} color="blue" />
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleExport}
                  disabled={filteredData.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-md shadow-green-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download XLSX
                </button>
                <div className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-center">
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Domain: {filters.managementDomain}</span>
                </div>
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <Visualizations data={filteredData} />
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-2 duration-500">
                <LegislationList items={filteredData} searchTerm={filters.searchTerm} onClear={resetFilters} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;