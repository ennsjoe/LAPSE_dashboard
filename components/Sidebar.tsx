
import React from 'react';
import { MANAGEMENT_DOMAINS } from '../constants';

interface SidebarProps {
  activeDomain: string;
  onDomainSelect: (domain: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeDomain, onDomainSelect }) => {
  return (
    <aside className="w-64 border-r border-gray-200 flex-shrink-0 flex flex-col z-20 overflow-hidden shadow-sm" style={{ backgroundColor: '#4A5F7A' }}>
      <div className="p-4 border-b" style={{ backgroundColor: '#384A5F' }}>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Management Domains</h3>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
        {MANAGEMENT_DOMAINS.map((domain) => (
          <button
            key={domain}
            onClick={() => onDomainSelect(domain)}
            className={`w-full text-left px-3 py-3 rounded-lg text-xs transition-all duration-200 border border-transparent ${
              activeDomain === domain
                ? 'text-white font-bold shadow-sm'
                : 'text-blue-100 hover:bg-blue-600 hover:text-white'
            }`}
            style={activeDomain === domain ? { backgroundColor: 'rgba(255, 255, 255, 0.2)' } : {}}
          >
            {domain}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
