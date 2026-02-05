import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

interface ActivityChartProps {
  data?: { date: string; demandas: number; resolucoes: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  // Generate last 15 days data if not provided (Simulation)
  const chartData = useMemo(() => {
    if (data) return data;

    const days = [];
    const today = new Date();
    
    // Generate dates for the last 15 days inclusive
    for (let i = 14; i >= 0; i--) {
      const d = subDays(today, i);
      days.push({
        date: format(d, 'dd/MM'),
        fullDate: format(d, 'yyyy-MM-dd'),
        // Random values simulating varying activity
        demandas: Math.floor(Math.random() * 8) + 2, // 2-10 requests
        resolucoes: Math.floor(Math.random() * 6) + 3, // 3-9 resolutions
      });
    }
    return days;
  }, [data]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-marinho/10">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-marinho">Atividade Recente</h3>
        <p className="text-sm text-marinho/60">Demandas vs Resoluções (Últimos 15 dias)</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="99%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {/* Palha Line for Demandas (Requests) */}
            <Line 
              type="monotone" 
              dataKey="demandas" 
              name="Novas Demandas"
              stroke="#b88455" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#b88455', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
            
            {/* Mata Line for Resolucoes (Resolutions) */}
            <Line 
              type="monotone" 
              dataKey="resolucoes" 
              name="Resolvidos"
              stroke="#455637" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#455637', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
