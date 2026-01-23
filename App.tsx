import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { LegislationItem, FilterState, FilterOption } from './types';
import { loadingBackgroundColor } from './constants';
import Sidebar from './components/Sidebar';
import Filters from './components/Filters';
import Visualizations from './components/Visualizations';
import LegislationList from './components/LegislationList';
import ClauseFilters from './components/ClauseFilters';
import * as dataService from './services/dataService';

const StatCard: React.FC<{ label: string; value: string | number; color: string; isText?: boolean }> = ({ label, value, color, isText }) => (
  <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col transition-all hover:shadow-md">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{label}</span>
    <span className={`text-xl font-black truncate ${isText ? 'text-gray-800' : `text-${color}-600`}`}>{value}</span>
  </div>
);

const loadingStyle = { backgroundColor: loadingBackgroundColor };
const App: React.FC = () => {
  const [data, setData] = useState<LegislationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLastProcessed, setDataLastProcessed] = useState<string>('Unknown');
  const [totalLegislation, setTotalLegislation] = useState<number>(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeployGuide, setShowDeployGuide] = useState(false);
  const [disclaimerCollapsed, setDisclaimerCollapsed] = useState(false);
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false);
  const [legislationCollapsed, setLegislationCollapsed] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    jurisdiction: 'All',
    managementDomain: 'All',
    searchTerm: '',
    actName: 'All',
    legislationName: 'All',
    clauseType: 'All',
    actionableType: 'All',
    responsibleOfficial: 'All',
    discretionType: 'All'
  });

  // Debounce search term updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, searchTerm: localSearchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  const resetFilters = useCallback(() => {
    setFilters({
      jurisdiction: 'All',
      managementDomain: 'All',
      searchTerm: '',
      actName: 'All',
      legislationName: 'All',
      clauseType: 'All',
      actionableType: 'All',
      responsibleOfficial: 'All',
      discretionType: 'All'
    });
    setLocalSearchTerm('');
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const legislationData = await dataService.loadLegislationData();
      
      // Count unique legislation records
      const uniqueLegislationIds = new Set(legislationData.map(item => item.legislation_id));
      
      setData(legislationData);
      setTotalLegislation(uniqueLegislationIds.size);
      setDataLastProcessed(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      setError(null);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError("DATA_NOT_FOUND");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    const term = filters.searchTerm.toLowerCase().trim();
    const selectedDomain = filters.managementDomain;

    // First pass: apply strict filters (jurisdiction, act/reg, type constraint). Do not filter out by management domain yet.
    const base = data.filter(item => {
      const jMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const aMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const lMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      // When a specific regulation/code/order is selected, only show that regulation
      // When no regulation is selected, only show the Act itself (not regulations)
      const typeMatch = filters.legislationName !== 'All'
        ? true // Show the selected regulation as-is
        : filters.actName !== 'All'
        ? item.legislation_type === 'Act' // Show only Acts when no regulation selected
        : true;
      return jMatch && aMatch && lMatch && typeMatch;
    });

    // Group by legislation + section key
    const groups = new Map<string, LegislationItem[]>();
    base.forEach(item => {
      const sectionKey = item.section && item.section.trim() ? item.section.trim() : `para-${item.paragraph_id}`;
      const key = `${item.legislation_id}|${sectionKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    // Decide inclusion per section: if ANY item in a section matches filters, include ALL items in that section
    const results: LegislationItem[] = [];
    groups.forEach(group => {
      const domainRequired = selectedDomain !== 'All';
      const termRequired = !!term;
      const clauseRequired = filters.clauseType !== 'All';
      const actionableRequired = filters.actionableType !== 'All';
      const officialRequired = filters.responsibleOfficial !== 'All';
      const discretionRequired = filters.discretionType !== 'All';

      // Check if ANY item in the group matches the filters
      const hasMatchingItem = group.some(item => {
        // Handle semicolon-separated management domains
        const domainValues = (item.management_domain || '').split(';').map(d => d.trim()).filter(Boolean);
        const domainMatch = !domainRequired || domainValues.some(d => d.toLowerCase() === selectedDomain.toLowerCase());
        const haystack = `${item.act_name} ${item.legislation_name} ${item.heading} ${item.paragraph}`.toLowerCase();
        const termMatch = !termRequired || haystack.includes(term);
        
        // Handle semicolon-separated values in clause filters
        const clauseValues = (item.clause_type || '').split(';').map(v => v.trim()).filter(Boolean);
        const clauseMatch = !clauseRequired || clauseValues.some(v => v.toLowerCase() === filters.clauseType.toLowerCase());
        
        const actionableValues = (item.actionable_type || '').split(';').map(v => v.trim()).filter(Boolean);
        const actionableMatch = !actionableRequired || actionableValues.some(v => v.toLowerCase() === filters.actionableType.toLowerCase());
        
        const officialValues = (item.responsible_official || '').split(';').map(v => v.trim()).filter(Boolean);
        const officialMatch = !officialRequired || officialValues.some(v => v.toLowerCase() === filters.responsibleOfficial.toLowerCase());
        
        const discretionValues = (item.discretion_type || '').split(';').map(v => v.trim()).filter(Boolean);
        const discretionMatch = !discretionRequired || discretionValues.some(v => v.toLowerCase() === filters.discretionType.toLowerCase());
        
        return domainMatch && termMatch && clauseMatch && actionableMatch && officialMatch && discretionMatch;
      });

      // If any item matches, include ALL items from this section
      if (hasMatchingItem) {
        results.push(...group);
      }
    });

    return results;
  }, [filters, data]);

  const availableActs = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => {
      const domainValues = (item.management_domain || '').split(';').map(d => d.trim()).filter(Boolean);
      const domainMatch = filters.managementDomain === 'All' || domainValues.some(d => d.toLowerCase() === filters.managementDomain.toLowerCase());
      const jurisdictionMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      return domainMatch && jurisdictionMatch;
    });
    // Count items per act
    const actCounts = new Map<string, number>();
    context.forEach(item => {
      if (item.act_name) {
        actCounts.set(item.act_name, (actCounts.get(item.act_name) || 0) + 1);
      }
    });
    const uniqueActs = Array.from(actCounts.keys()).sort((a, b) => a.localeCompare(b));
    const result = [
      { name: 'All', count: uniqueActs.length },
      ...uniqueActs.map(name => ({ name, count: actCounts.get(name) || 0 }))
    ];
    return result.map(item => item.name === 'All' ? { name: 'All', displayName: 'None Selected', count: item.count } : { ...item, displayName: item.name });
  }, [data, filters.jurisdiction, filters.managementDomain]);

  const availableLegislation = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => {
      const domainValues = (item.management_domain || '').split(';').map(d => d.trim()).filter(Boolean);
      const domainMatch = filters.managementDomain === 'All' || domainValues.some(d => d.toLowerCase() === filters.managementDomain.toLowerCase());
      const jurisdictionMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const actMatch = filters.actName === 'All' || item.act_name === filters.actName;
      // Include regulations, codes, and orders (exclude Acts)
      const type = (item.legislation_type || '').toLowerCase();
      const isRegulation = type !== 'act' && (type.includes('regulation') || type.includes('code') || type.includes('order') || type.length > 0);
      return domainMatch && jurisdictionMatch && actMatch && isRegulation;
    });
    // Count items per legislation/regulation
    const regCounts = new Map<string, number>();
    context.forEach(item => {
      if (item.legislation_name) {
        regCounts.set(item.legislation_name, (regCounts.get(item.legislation_name) || 0) + 1);
      }
    });
    const uniqueRegs = Array.from(regCounts.keys()).sort((a, b) => a.localeCompare(b));
    const result = [
      { name: 'All', count: uniqueRegs.length },
      ...uniqueRegs.map(name => ({ name, count: regCounts.get(name) || 0 }))
    ];
    return result.map(item => item.name === 'All' ? { name: 'All', displayName: 'None Selected', count: item.count } : { ...item, displayName: item.name });
  }, [data, filters.jurisdiction, filters.actName, filters.managementDomain]);

  const selectedLegislationUrl = useMemo(() => {
    // Get the URL of the currently selected legislation/act
    if (filters.legislationName !== 'All') {
      // Specific regulation/code/order is selected
      const item = data.find(d => d.legislation_name === filters.legislationName);
      return item?.url;
    } else if (filters.actName !== 'All') {
      // Act is selected but no specific regulation - find the act-level entry
      const item = data.find(d => d.act_name === filters.actName && d.legislation_type === 'Act');
      return item?.url;
    }
    return undefined;
  }, [data, filters.actName, filters.legislationName]);

  // Clause filter options
  const availableClauseTypes = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => {
      const domainValues = (item.management_domain || '').split(';').map(d => d.trim()).filter(Boolean);
      const domainMatch = filters.managementDomain === 'All' || domainValues.some(d => d.toLowerCase() === filters.managementDomain.toLowerCase());
      const jurisdictionMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const actMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const legMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      return domainMatch && jurisdictionMatch && actMatch && legMatch;
    });
    const counts = new Map<string, number>();
    context.forEach(item => {
      const types = (item.clause_type || '').split(';').map(t => t.trim()).filter(Boolean);
      types.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    });
    const uniqueTypes = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));
    return [
      { name: 'All', count: uniqueTypes.length },
      ...uniqueTypes.map(name => ({ name, count: counts.get(name) || 0 }))
    ];
  }, [data, filters.managementDomain, filters.jurisdiction, filters.actName, filters.legislationName]);

  const availableActionableTypes = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => {
      const domainValues = (item.management_domain || '').split(';').map(d => d.trim()).filter(Boolean);
      const domainMatch = filters.managementDomain === 'All' || domainValues.some(d => d.toLowerCase() === filters.managementDomain.toLowerCase());
      const jurisdictionMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const actMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const legMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      return domainMatch && jurisdictionMatch && actMatch && legMatch;
    });
    const counts = new Map<string, number>();
    const normalized = new Map<string, string>();
    context.forEach(item => {
      const types = (item.actionable_type || '').split(';').map(t => t.trim()).filter(Boolean);
      types.forEach(t => {
        const lower = t.toLowerCase();
        const canonical = normalized.get(lower) || t;
        normalized.set(lower, canonical);
        counts.set(canonical, (counts.get(canonical) || 0) + 1);
      });
    });
    const uniqueTypes = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));
    return [
      { name: 'All', count: uniqueTypes.length },
      ...uniqueTypes.map(name => ({ name, count: counts.get(name) || 0 }))
    ];
  }, [data, filters.managementDomain, filters.jurisdiction, filters.actName, filters.legislationName]);

  const availableResponsibleOfficials = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => {
      const domainValues = (item.management_domain || '').split(';').map(d => d.trim()).filter(Boolean);
      const domainMatch = filters.managementDomain === 'All' || domainValues.some(d => d.toLowerCase() === filters.managementDomain.toLowerCase());
      const jurisdictionMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const actMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const legMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      return domainMatch && jurisdictionMatch && actMatch && legMatch;
    });
    const counts = new Map<string, number>();
    const normalized = new Map<string, string>();
    context.forEach(item => {
      const officials = (item.responsible_official || '').split(';').map(o => o.trim()).filter(Boolean);
      officials.forEach(o => {
        const lower = o.toLowerCase();
        const canonical = normalized.get(lower) || o;
        normalized.set(lower, canonical);
        counts.set(canonical, (counts.get(canonical) || 0) + 1);
      });
    });
    const uniqueOfficials = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));
    return [
      { name: 'All', count: uniqueOfficials.length },
      ...uniqueOfficials.map(name => ({ name, count: counts.get(name) || 0 }))
    ];
  }, [data, filters.managementDomain, filters.jurisdiction, filters.actName, filters.legislationName]);

  const availableDiscretionTypes = useMemo<FilterOption[]>(() => {
    const context = data.filter(item => {
      const domainValues = (item.management_domain || '').split(';').map(d => d.trim()).filter(Boolean);
      const domainMatch = filters.managementDomain === 'All' || domainValues.some(d => d.toLowerCase() === filters.managementDomain.toLowerCase());
      const jurisdictionMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const actMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const legMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      return domainMatch && jurisdictionMatch && actMatch && legMatch;
    });
    const counts = new Map<string, number>();
    const normalized = new Map<string, string>();
    context.forEach(item => {
      const types = (item.discretion_type || '').split(';').map(t => t.trim()).filter(Boolean);
      types.forEach(t => {
        const lower = t.toLowerCase();
        const canonical = normalized.get(lower) || t;
        normalized.set(lower, canonical);
        counts.set(canonical, (counts.get(canonical) || 0) + 1);
      });
    });
    const uniqueTypes = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));
    return [
      { name: 'All', count: uniqueTypes.length },
      ...uniqueTypes.map(name => ({ name, count: counts.get(name) || 0 }))
    ];
  }, [data, filters.managementDomain, filters.jurisdiction, filters.actName, filters.legislationName]);

  const availableDomains = useMemo<Array<{ name: string; count: number }>>(() => {
    // Filter data by jurisdiction, act, and legislation if selected
    const context = data.filter(item => {
      const jurisdictionMatch = filters.jurisdiction === 'All' || item.jurisdiction === filters.jurisdiction;
      const actMatch = filters.actName === 'All' || item.act_name === filters.actName;
      const legMatch = filters.legislationName === 'All' || item.legislation_name === filters.legislationName;
      return jurisdictionMatch && actMatch && legMatch;
    });
    
    // Count keyword matches per domain
    const domainCounts = new Map<string, number>();
    const normalized = new Map<string, string>();
    
    context.forEach(item => {
      // Split management domains by semicolon
      const domains = (item.management_domain || '').split(';').map(d => d.trim()).filter(d => d.length > 0);
      domains.forEach(domain => {
        // Normalize by capitalization
        const lower = domain.toLowerCase();
        const canonical = normalized.get(lower) || domain;
        normalized.set(lower, canonical);
        
        // Count keywords for this domain
        const keywords = (item.mgmt_d_keyword || '').split(';').filter(k => k.trim().length > 0);
        domainCounts.set(canonical, (domainCounts.get(canonical) || 0) + keywords.length);
      });
    });
    
    // Sort by count (descending), then by name (ascending)
    const sorted = Array.from(domainCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count; // Descending by count
        }
        return a.name.localeCompare(b.name); // Ascending by name
      });
    
    return sorted;
  }, [data, filters.jurisdiction, filters.actName, filters.legislationName]);

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
      <div className="tracking-widest uppercase text-[10px] animate-pulse">Loading LAPSE Data...</div>
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
        
        <div className="mb-8">
          <button onClick={loadData} className="w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95">
            Retry Connection
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-inner">
          <p className="text-xs text-gray-400">Please ensure the CSV data files (paragraph_output.csv, legislation_output.csv, iucn_l2_keywords.csv, governance_keywords.csv) are available in the public directory.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden text-gray-900">
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
              className="w-full text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98]"
              style={{ backgroundColor: '#5FA3D0', boxShadow: '0 20px 25px -5px rgba(95, 163, 208, 0.2)' }}
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
                <button onClick={() => setShowDeployGuide(false)} className="w-full py-3 rounded-xl font-bold text-xs uppercase transition-colors" style={{ backgroundColor: '#E8F0F5', color: '#5FA3D0' }}>Back to About</button>
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
                    className="flex-1 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#6FA577' }}
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

      <header className="border-b border-gray-200 px-6 py-4 shadow-sm flex items-center justify-between" style={{ backgroundColor: '#2C3E50' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-white">Legislation Applicable to Pacific Salmon and Ecosystems (LAPSE)</h1>
        </div>
        <button 
          onClick={() => setShowAbout(true)}
          className="text-white hover:text-gray-200 transition-all hover:scale-110"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      </header>

      {/* Info Panel Cluster */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Dashboard Info</h3>
          <button
            onClick={() => setInfoPanelCollapsed(!infoPanelCollapsed)}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            {infoPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {infoPanelCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
        </div>

        {!infoPanelCollapsed && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl shadow-sm w-full lg:flex-1 min-w-[260px]">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 text-xs text-amber-900 leading-relaxed">
                <div className="font-black text-amber-800">Disclaimer</div>
                {!disclaimerCollapsed && (
                  <p className="mt-1">None of the information presented in LAPSE qualifies as legal advice. The authors are aquatic biologists with limited legal training. This tool is intended for research and informational purposes only. Always consult official government sources and qualified legal professionals for authoritative legal interpretation.</p>
                )}
                {disclaimerCollapsed && (
                  <div className="font-bold">Disclaimer (click arrow to expand)</div>
                )}
              </div>
              <button
                onClick={() => setDisclaimerCollapsed(!disclaimerCollapsed)}
                className="text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
                aria-label={disclaimerCollapsed ? "Expand disclaimer" : "Collapse disclaimer"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {disclaimerCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 px-4 py-3 rounded-xl shadow-sm w-full sm:w-auto lg:flex-1 min-w-[260px]">
              <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <div className="text-xs text-sky-900">
                <div className="font-black uppercase tracking-widest text-[11px] text-sky-700">Data Last Processed</div>
                <div className="mt-0.5">{dataLastProcessed}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-sky-900">
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span><strong className="text-sky-700">Total Legislation:</strong> {totalLegislation} acts</span>
              </div>
            </div>

            <a
              className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl shadow-sm w-full sm:w-auto lg:flex-1 min-w-[220px] hover:shadow-md transition-shadow"
              href="https://ennsjoe.github.io/salmon_management_domains_compendium/LAPSE-Dashboard-About.html"
              target="_blank"
              rel="noreferrer"
            >
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 19a7 7 0 110-14 7 7 0 010 14z" />
              </svg>
              <div className="text-xs text-emerald-900">
                <div className="font-black uppercase tracking-widest text-[11px] text-emerald-700">About LAPSE Dashboard</div>
                <div className="mt-0.5 text-emerald-800">Open the About page</div>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* Main content: 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Domain sidebar - hidden on md and below, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar 
            activeDomain={filters.managementDomain} 
            onDomainSelect={(d) => handleFilterChange('managementDomain', d)}
            searchTerm={localSearchTerm}
            onSearchChange={setLocalSearchTerm}
            availableDomains={availableDomains}
          />
        </div>

        {/* Center column: Filters and legislation */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
          <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-gray-800 text-sm">Legislation Panel</h3>
            <div className="flex items-center gap-4">
              {legislationCollapsed && (
                <div className="text-[11px] text-gray-600 flex items-center gap-3">
                  <span className="font-semibold">Act:</span>
                  <span className="text-gray-800">{filters.actName === 'All' ? 'None Selected' : filters.actName}</span>
                  <span className="font-semibold">Reg:</span>
                  <span className="text-gray-800">{filters.legislationName === 'All' ? 'None Selected' : filters.legislationName}</span>
                </div>
              )}
              {selectedLegislationUrl && (
                <a
                  href={selectedLegislationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                >
                  View Full Legislation
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              <button
                onClick={() => setLegislationCollapsed(!legislationCollapsed)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                {legislationCollapsed ? 'Expand' : 'Collapse'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {legislationCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {!legislationCollapsed && (
            <>
              {/* Filters section */}
              <div className="border-b border-gray-200 bg-white p-4 space-y-4 flex-shrink-0">
                {/* Management Domain selector - visible only on smaller screens when sidebar is hidden */}
                <div className="lg:hidden space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Management Domain</label>
                  <select
                    value={filters.managementDomain}
                    onChange={(e) => handleFilterChange('managementDomain', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="All">All Domains</option>
                    {availableDomains.map(domain => (
                      <option key={domain.name} value={domain.name}>
                        {domain.name} ({domain.count})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Filter by Jurisdiction</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleFilterChange('jurisdiction', 'All')}
                      className={`flex-1 px-3 py-2 text-xs font-semibold rounded transition-all ${
                        filters.jurisdiction === 'All' ? 'text-white' : 'text-gray-600'
                      }`}
                      style={filters.jurisdiction === 'All' ? { backgroundColor: '#A8B5C7' } : { backgroundColor: '#f3f4f6' }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleFilterChange('jurisdiction', 'Federal')}
                      className={`flex-1 px-3 py-2 text-xs font-semibold rounded transition-all ${
                        filters.jurisdiction === 'Federal' ? 'text-white' : 'text-gray-600'
                      }`}
                      style={filters.jurisdiction === 'Federal' ? { backgroundColor: '#996666' } : { backgroundColor: '#f3f4f6' }}
                    >
                      Federal
                    </button>
                    <button
                      onClick={() => handleFilterChange('jurisdiction', 'Provincial')}
                      className={`flex-1 px-3 py-2 text-xs font-semibold rounded transition-all ${
                        filters.jurisdiction === 'Provincial' ? 'text-white' : 'text-gray-600'
                      }`}
                      style={filters.jurisdiction === 'Provincial' ? { backgroundColor: '#668899' } : { backgroundColor: '#f3f4f6' }}
                    >
                      Provincial
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Select Legislation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Acts</label>
                      <select 
                        value={filters.actName}
                        onChange={(e) => handleFilterChange('actName', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {availableActs.map(a => <option key={a.name} value={a.name}>{(a as any).displayName || a.name} ({a.count})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Regulations / Codes / Orders</label>
                      <select 
                        value={filters.legislationName}
                        onChange={(e) => handleFilterChange('legislationName', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {availableLegislation.map(l => <option key={l.name} value={l.name}>{(l as any).displayName || l.name} ({l.count})</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={resetFilters}
                  className="w-full px-3 py-2 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </>
          )}

          {/* Sections display - always visible */}
          <div className="border-b border-gray-200 px-4 py-3 font-bold text-gray-700 text-sm bg-white">
            Sections and Paragraphs
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <LegislationList 
              items={filteredData} 
              searchTerm={filters.searchTerm} 
              activeDomain={filters.managementDomain} 
              selectedActName={filters.actName}
              selectedLegislationName={filters.legislationName}
              selectedClauseType={filters.clauseType}
              onClear={resetFilters} 
            />
          </div>
        </div>

        {/* Right column: Visualizations - responsive width */}
        <div className="w-full md:w-72 lg:w-80 flex flex-col bg-white overflow-hidden border-l border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3 font-bold text-gray-700 text-sm">
            Results & Visualizations
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <button 
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="w-full py-2 px-3 text-xs font-bold text-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6FA577' }}
            >
              Download XLSX
            </button>
            <div className="h-px bg-gray-200"></div>
            <Visualizations data={filteredData} selectedDomain={filters.managementDomain} />
            <ClauseFilters
              clauseType={filters.clauseType}
              actionableType={filters.actionableType}
              responsibleOfficial={filters.responsibleOfficial}
              discretionType={filters.discretionType}
              clauseTypeOptions={availableClauseTypes}
              actionableTypeOptions={availableActionableTypes}
              responsibleOfficialOptions={availableResponsibleOfficials}
              discretionTypeOptions={availableDiscretionTypes}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;