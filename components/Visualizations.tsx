
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
      .slice(0, 12);
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
    return <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">No data to visualize.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5FA3D0' }}></span>
          Most Frequent Domain Keywords
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keywordFreqData} layout="vertical" margin={{ left: 0, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              />
              <Bar dataKey="value" fill="#5FA3D0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#6FA577' }}></span>
          IUCN Threat Classification
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={threatData}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {threatData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={60} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
