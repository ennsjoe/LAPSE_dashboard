
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { LegislationItem } from '../types';

interface VisualizationsProps {
  data: LegislationItem[];
}

const Visualizations: React.FC<VisualizationsProps> = ({ data }) => {
  const keywordFreqData = useMemo(() => {
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
      .slice(0, 8);
  }, [data]);

  const threatData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const label = item.iucn_threat || "Unspecified";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const COLORS = ['#5FA3D0', '#6FA577', '#9BA8A0', '#A8B5C7', '#8A9FB3', '#7A8F8A', '#9BA39A', '#7FA89B'];

  if (data.length === 0) {
    return <div className="p-6 text-center text-gray-400 text-sm">No data to visualize.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">
          Keyword Frequency
        </h4>
        <div style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keywordFreqData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80} 
                tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
              />
              <Bar dataKey="value" fill="#5FA3D0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">
          IUCN Threats
        </h4>
        <div style={{ height: '160px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={threatData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
