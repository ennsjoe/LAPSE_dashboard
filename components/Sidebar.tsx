
import React from 'react';
import { MANAGEMENT_DOMAINS } from '../constants';

interface SidebarProps {
  activeDomain: string;
  onDomainSelect: (domain: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeDomain, onDomainSelect, searchTerm, onSearchChange }) => {
  return (
    <aside className="w-56 border-r border-gray-200 flex-shrink-0 flex flex-col shadow-sm text-white" style={{ backgroundColor: '#2C3E50' }}>
      {/* Search section */}
      <div className="px-3 py-3 border-b border-gray-200">
        <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-2">Search Keywords</label>
        <div className="relative">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Enter keywords..."
            className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
          />
          <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Management Domains</h3>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {/* Reset/All button */}
        <button
          onClick={() => onDomainSelect('All')}
          className="w-full text-left px-3 py-2.5 rounded text-sm transition-all font-semibold text-white hover:bg-white/10"
          style={activeDomain === 'All' ? { backgroundColor: '#2C3E50' } : {}}
        >
          ↺ All Domains
        </button>

        <div className="border-t border-gray-200 my-2"></div>

        {MANAGEMENT_DOMAINS
          .filter(domain => activeDomain === 'All' || activeDomain === domain)
          .map((domain) => (
            <button
              key={domain}
              onClick={() => onDomainSelect(domain)}
              className={`w-full text-left px-3 py-2.5 rounded text-sm transition-all ${
                activeDomain === domain
                  ? 'text-white font-semibold shadow-sm'
                  : 'text-white hover:bg-white/10 font-normal'
              }`}
              style={activeDomain === domain ? { backgroundColor: '#2C3E50' } : {}}
              title={domain}
            >
              {domain}
            </button>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
