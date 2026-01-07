
import React from 'react';
import { MANAGEMENT_DOMAINS } from '../constants';

interface SidebarProps {
  activeDomain: string;
  onDomainSelect: (domain: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeDomain, onDomainSelect }) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col z-20 overflow-hidden shadow-sm">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Management Domains</h3>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
        {MANAGEMENT_DOMAINS.map((domain) => (
          <button
            key={domain}
            onClick={() => onDomainSelect(domain)}
            className={`w-full text-left px-3 py-3 rounded-lg text-xs transition-all duration-200 border border-transparent ${
              activeDomain === domain
                ? 'bg-blue-50 text-blue-700 font-bold border-blue-100 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {domain}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
