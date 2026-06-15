import { useState, useMemo } from 'react';
import { TrendingUp, User, MapPin, Calendar, FileText, Trophy } from 'lucide-react';
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
        if (!order.date) return false;
        
        const [year, month, day] = order.date.split('-');
        const orderDate = new Date(Number(year), Number(month) - 1, Number(day));
        
        const [startYear, startMonth, startDay] = dateRange.start.split('-');
        const start = new Date(Number(startYear), Number(startMonth) - 1, Number(startDay));
        
        const [endYear, endMonth, endDay] = dateRange.end.split('-');
        const end = new Date(Number(endYear), Number(endMonth) - 1, Number(endDay));
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

    // Calculate Top Location for the KPI Card
    let mostFrequentLoc = 'N/A';
    let maxLocCount = 0;
    const globalLocMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
        const loc = o.location || 'Não informado';
        globalLocMap[loc] = (globalLocMap[loc] || 0) + 1;
        if (globalLocMap[loc] > maxLocCount) {
            maxLocCount = globalLocMap[loc];
            mostFrequentLoc = loc;
        }
    });

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
        label: 'Local Mais Crítico', 
        value: mostFrequentLoc, 
        subtext: `${maxLocCount} chamados`, 
        trend: 'bad', 
        icon: MapPin 
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
    const techMap: Record<string, { resolved: number, locations: Record<string, number> }> = {};

    filteredOrders.forEach(order => {
        if (order.status === 'concluido' && order.history) {
            const resolution = order.history.find((h: any) => h.type === 'resolution');

            if (resolution && resolution.details?.resolver) {
                const resolverName = resolution.details.resolver;
                const loc = order.location || 'Não informado';
                
                if (!techMap[resolverName]) {
                    techMap[resolverName] = { resolved: 0, locations: {} };
                }
                techMap[resolverName].resolved += 1;
                techMap[resolverName].locations[loc] = (techMap[resolverName].locations[loc] || 0) + 1;
            }
        }
    });

    return Object.entries(techMap)
        .map(([name, data]) => {
            // Find top location for this tech
            let topLoc = 'N/A';
            let maxCount = 0;
            Object.entries(data.locations).forEach(([loc, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topLoc = loc;
                }
            });

            return {
                name,
                resolved: data.resolved,
                topLocation: topLoc
            };
        })
        .sort((a, b) => b.resolved - a.resolved);

  }, [filteredOrders]);


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Mobile View — KPIs + Listas */}
      <div className="md:hidden space-y-4">
        <div>
          <h1 className="text-xl font-bold text-marinho">Relatórios</h1>
          <p className="text-xs text-slate-500 mt-0.5">Métricas do período atual</p>
        </div>

        {/* KPI Cards — mobile */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">{stat.label}</p>
              <p className={`text-xl font-bold mt-1 ${stat.trend === 'good' ? 'text-mata' : stat.trend === 'bad' ? 'text-red-500' : 'text-marinho'}`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* Top Locais — mobile */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-800">Locais com Mais Chamados</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {topLocations.length > 0 ? topLocations.map((loc, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-slate-700">{loc.name}</span>
                  <span className="text-xs text-slate-400">{loc.count} • {loc.percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${loc.percent}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum dado neste período.</p>
            )}
          </div>
        </div>

        {/* Desempenho Técnicos — mobile */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            <h2 className="text-sm font-bold text-slate-800">Equipe Técnica</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {techPerformance.length > 0 ? techPerformance.slice(0, 5).map((tech, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-yellow-100 text-yellow-700' :
                  i === 1 ? 'bg-slate-200 text-slate-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">{tech.name}</span>
                <div className="text-right">
                  <span className="block text-base font-bold text-slate-800">{tech.resolved}</span>
                  <span className="text-[10px] text-slate-400">chamados</span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum dado neste período.</p>
            )}
          </div>
        </div>
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
                    <th className="px-4 py-3 rounded-r-md">Setor Principal</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {techPerformance.length > 0 ? techPerformance.map((tech, i) => (
                    <tr key={i}>
                    <td className="px-4 py-3 font-medium text-slate-800">{tech.name}</td>
                    <td className="px-4 py-3">{tech.resolved}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{tech.topLocation}</td>
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
