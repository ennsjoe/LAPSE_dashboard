
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
      // Only include management domain keywords
      const keywords = (item.management_domain_keywords?.split(';') || [])
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
      
      keywords.forEach(k => counts[k] = (counts[k] || 0) + 1);
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const scopeData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const label = item.scope || "Unknown";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

  if (data.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-500">
        <p className="text-lg">No data available for the current selection.</p>
        <p className="text-sm">Try adjusting your filters or management domain.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Keyword Frequency */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Top 10 Domain Keywords</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keywordFreqData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80} 
                tick={{ fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scope Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Legislative Scope</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scopeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {scopeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
