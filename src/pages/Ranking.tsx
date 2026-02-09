import { useState, useMemo } from 'react';
import { TrendingUp, User, MapPin, Calendar, FileText, Clock, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOrders } from '../contexts/OrdersContext';
import { startOfMonth } from 'date-fns';

export function Ranking() {
  const { orders } = useOrders();
  
  // Date Filter State
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Filter Orders based on Date Range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      try {
        const orderDate = new Date(order.date); // order.date is usuallly YYYY-MM-DD string or ISO
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        // Set end to end of day
        end.setHours(23, 59, 59, 999);
        
        return orderDate >= start && orderDate <= end;
      } catch (e) {
        return false;
      }
    });
  }, [orders, dateRange]);

  // Dynamic Stats Calculations
  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const completed = filteredOrders.filter(o => o.status === 'concluido').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate Average Time
    let totalMinutes = 0;
    let resolvedCountWithTime = 0;

    filteredOrders.forEach(o => {
        if (o.status === 'concluido') {
            const createdLog = o.history?.find((h: any) => h.type === 'creation');
            const resolvedLog = o.history?.find((h: any) => h.type === 'resolution');
            
            // Try to deduce timestamps
            let start: Date | null = null;
            let end: Date | null = null;

            if (createdLog) start = new Date(createdLog.created_at);
            else {
                // Determine via order date fields (less precise but fallback)
                // Assuming "date" and "time" fields are creation time
                const dateTimeStr = `${o.date}T${o.time}`;
                // Validating basic format or just constructing Date
                const d = new Date(dateTimeStr);
                if (!isNaN(d.getTime())) start = d;
            }

            if (resolvedLog) end = new Date(resolvedLog.created_at);
            // We can add fallback for resolution date if we stored it in 'details.date + time', but log created_at usually suffices.

            if (start && end && end > start) {
                const diffMs = end.getTime() - start.getTime();
                const diffMins = diffMs / (1000 * 60);
                totalMinutes += diffMins;
                resolvedCountWithTime++;
            }
        }
    });

    let avgTimeDisplay = 'N/A';
    if (resolvedCountWithTime > 0) {
        const avgMins = totalMinutes / resolvedCountWithTime;
        const hours = Math.floor(avgMins / 60);
        const mins = Math.round(avgMins % 60);
        avgTimeDisplay = `${hours}h ${mins}m`;
    }

    return [
      { 
        label: 'Total de Solicitações', 
        value: total.toString(), 
        subtext: 'No período selecionado', 
        trend: 'neutral', 
        icon: FileText 
      },
      { 
        label: 'Taxa de Finalização', 
        value: `${completionRate}%`, 
        subtext: `${completed} resolvidos`, 
        trend: completionRate >= 80 ? 'good' : 'bad', 
        icon: TrendingUp 
      },
      { 
        label: 'Tempo Médio (Est.)', 
        value: avgTimeDisplay, 
        subtext: 'Baseado no histórico', 
        trend: 'good', 
        icon: Clock 
      },
    ];
  }, [filteredOrders]);

  // Dynamic Top Locations
  const topLocations = useMemo(() => {
    const locMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const locationName = o.location || 'Não informado';
      locMap[locationName] = (locMap[locationName] || 0) + 1;
    });
    
    const sorted = Object.entries(locMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // Top 5

    return sorted.map(([name, count]) => ({
      name,
      count,
      percent: filteredOrders.length > 0 ? Math.round((count / filteredOrders.length) * 100) : 0
    }));
  }, [filteredOrders]);

  // Dynamic Top Requesters
  const topRequesters = useMemo(() => {
    const userMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const requester = o.requester || 'Anônimo';
      userMap[requester] = (userMap[requester] || 0) + 1;
    });

    return Object.entries(userMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        role: 'Colaborador', // Placeholder role
        count,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      }));
  }, [filteredOrders]);

  // Real Technician Performance based on History Logs
  const techPerformance = useMemo(() => {
    const techMap: Record<string, { resolved: number, totalMinutes: number }> = {};

    filteredOrders.forEach(order => {
        if (order.status === 'concluido' && order.history) {
            const resolution = order.history.find((h: any) => h.type === 'resolution');
            const creation = order.history.find((h: any) => h.type === 'creation');

            if (resolution && resolution.details?.resolver) {
                const resolverName = resolution.details.resolver;
                
                if (!techMap[resolverName]) {
                    techMap[resolverName] = { resolved: 0, totalMinutes: 0 };
                }
                techMap[resolverName].resolved += 1;

                // Time calc
                let start: Date | null = null;
                const end = new Date(resolution.created_at);

                if (creation) start = new Date(creation.created_at);
                else {
                    const d = new Date(`${order.date}T${order.time}`);
                    if (!isNaN(d.getTime())) start = d;
                }

                if (start && end && end > start) {
                    const diffMins = (end.getTime() - start.getTime()) / (1000 * 60);
                    techMap[resolverName].totalMinutes += diffMins;
                }
            }
        }
    });

    return Object.entries(techMap)
        .map(([name, data]) => {
            const avgMins = data.resolved > 0 ? data.totalMinutes / data.resolved : 0;
            const h = Math.floor(avgMins / 60);
            const m = Math.round(avgMins % 60);

            return {
                name,
                resolved: data.resolved,
                avgTime: data.totalMinutes > 0 ? `${h}h ${m}m` : 'N/A'
            };
        })
        .sort((a, b) => b.resolved - a.resolved);

  }, [filteredOrders]);


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Mobile Only Placeholder */}
      <div className="md:hidden flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm mt-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <TrendingUp size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Visualização Web</h2>
        <p className="text-slate-500 text-sm max-w-xs">
            Os relatórios detalhados e rankings estão disponíveis apenas na versão desktop para melhor visualização dos dados.
        </p>
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
            <h1 className="text-2xl font-bold text-marinho">Relatórios e Rankings</h1>
            <p className="text-sm text-slate-500">Métricas de desempenho filtradas por período.</p>
            </div>

            {/* Date Filter Inputs */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm">
            <Calendar size={18} className="text-slate-400 ml-2" />
            <div className="flex items-center gap-2">
                <input 
                type="date" 
                className="text-sm border-none focus:ring-0 text-slate-600 outline-none"
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <span className="text-slate-300">até</span>
                <input 
                type="date" 
                className="text-sm border-none focus:ring-0 text-slate-600 outline-none"
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
            </div>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                <div className={cn("flex items-center gap-1 text-xs font-medium mt-1", 
                    stat.trend === 'good' ? "text-green-600" : stat.trend === 'bad' ? "text-red-600" : "text-slate-500"
                )}>
                    {stat.subtext}
                </div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <stat.icon size={20} />
                </div>
            </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Locations Chart */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                Locais com Mais Chamados
            </h2>
            <div className="space-y-6">
                {topLocations.length > 0 ? topLocations.map((loc, i) => (
                <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{loc.name}</span>
                    <span className="text-slate-500">{loc.count} chamados ({loc.percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${loc.percent}%` }}
                    />
                    </div>
                </div>
                )) : (
                <p className="text-sm text-slate-400 text-center py-8">Nenhum dado neste período.</p>
                )}
            </div>
            </div>

            {/* Top Requesters List */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Top Solicitantes
            </h2>
            <div className="divide-y divide-slate-100">
                {topRequesters.length > 0 ? topRequesters.map((user, i) => (
                <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="relative">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-900 border-2 border-white shadow-sm">
                        #{i + 1}
                    </div>
                    </div>
                    <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                    <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                    <div className="text-right">
                    <span className="block text-lg font-bold text-slate-800">{user.count}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Solicitações</span>
                    </div>
                </div>
                )) : (
                <p className="text-sm text-slate-400 text-center py-8">Nenhum dado neste período.</p>
                )}
            </div>
            </div>

        </div>

        {/* Technician Performance (Real Data) */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            Desempenho da Equipe Técnica
            </h2>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                    <th className="px-4 py-3 rounded-l-md">Técnico</th>
                    <th className="px-4 py-3">Chamados Resolvidos</th>
                    <th className="px-4 py-3 rounded-r-md">Tempo Médio (em breve)</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {techPerformance.length > 0 ? techPerformance.map((tech, i) => (
                    <tr key={i}>
                    <td className="px-4 py-3 font-medium text-slate-800">{tech.name}</td>
                    <td className="px-4 py-3">{tech.resolved}</td>
                    <td className="px-4 py-3 text-slate-400">{tech.avgTime}</td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                            Nenhum chamado resolvido encontrado no período.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>
      </div>
    </div>
  );
}
