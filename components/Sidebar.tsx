
import React from 'react';
import { MANAGEMENT_DOMAINS } from '../constants';

interface SidebarProps {
  activeDomain: string;
  onDomainSelect: (domain: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeDomain, onDomainSelect }) => {
  return (
    <aside className="w-56 border-r border-gray-200 flex-shrink-0 flex flex-col bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Management Domains</h3>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {/* Reset/All button */}
        <button
          onClick={() => onDomainSelect('All')}
          className={`w-full text-left px-3 py-2.5 rounded text-sm transition-all font-semibold ${
            activeDomain === 'All'
              ? 'text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={activeDomain === 'All' ? { backgroundColor: '#A8B5C7' } : {}}
        >
          ↺ All Domains
        </button>

        <div className="border-t border-gray-200 my-2"></div>

        {MANAGEMENT_DOMAINS.map((domain) => (
          <button
            key={domain}
            onClick={() => onDomainSelect(domain)}
            className={`w-full text-left px-3 py-2.5 rounded text-sm transition-all ${
              activeDomain === domain
                ? 'text-white font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 font-normal'
            }`}
            style={activeDomain === domain ? { backgroundColor: '#668899' } : {}}
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
