
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { LegislationItem } from '../types';

interface VisualizationsProps {
  data: LegislationItem[];
  selectedDomain: string;
}

const Visualizations: React.FC<VisualizationsProps> = ({ data, selectedDomain }) => {
  const [activeTab, setActiveTab] = useState<'keywords' | 'iucn' | 'clause'>('keywords');

  const keywordFreqData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      // Only count keywords from items that match the selected domain
      const domainMatch = selectedDomain === 'All' || item.management_domain === selectedDomain;
      if (domainMatch) {
        const keywords = (item.mgmt_d_keyword?.split(';') || [])
          .map(k => k.trim())
          .filter(k => k.length > 2);
        keywords.forEach(k => counts[k] = (counts[k] || 0) + 1);
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data, selectedDomain]);

  const threatData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const domainMatch = selectedDomain === 'All' || item.management_domain === selectedDomain;
      if (!domainMatch) return;
      const labels = (item.iucn_threat || '').split(/[;,]/).map(t => t.trim()).filter(Boolean);
      labels.forEach(label => {
        if (label && label !== 'Unspecified') {
          counts[label] = (counts[label] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, selectedDomain]);

  const clauseTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const domainMatch = selectedDomain === 'All' || item.management_domain === selectedDomain;
      if (!domainMatch) return;
      const types = (item.clause_type || '').split(/[;,]/).map(c => c.trim()).filter(Boolean);
      types.forEach(t => counts[t] = (counts[t] || 0) + 1);
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data, selectedDomain]);

  const COLORS = ['#5FA3D0', '#6FA577', '#9BA8A0', '#A8B5C7', '#8A9FB3', '#7A8F8A', '#9BA39A', '#7FA89B'];

  if (data.length === 0) {
    return <div className="p-6 text-center text-gray-400 text-sm">No data to visualize.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="border-t border-gray-200 pt-3">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded border ${activeTab === 'keywords' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Keywords
          </button>
          <button
            onClick={() => setActiveTab('iucn')}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded border ${activeTab === 'iucn' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            IUCN
          </button>
          <button
            onClick={() => setActiveTab('clause')}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded border ${activeTab === 'clause' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Clause Type
          </button>
        </div>

        {activeTab === 'keywords' && (
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordFreqData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#2C3E50" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'iucn' && (
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {threatData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                />
                <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'clause' && (
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clauseTypeData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#6FA577" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Visualizations;
