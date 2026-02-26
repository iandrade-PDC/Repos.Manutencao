
import { StatCard } from '../components/dashboard/StatCard';
import { RankingList } from '../components/dashboard/RankingList';
import { ActivityChart } from '../components/dashboard/ActivityChart';
import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Activity, Clock, Users, Calendar, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight, RotateCcw 
} from 'lucide-react';
import { useOrders } from '../contexts/OrdersContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const [periodFilter, setPeriodFilter] = useState('geral'); // 'geral' (30 days), 'month' (current month), 'week' (7 days)

  // Filter orders based on period
  const filteredOrders = useMemo(() => {
    const today = new Date();
    // Normalize today to end of day to include all events today
    today.setHours(23, 59, 59, 999);
    
    let startDate = new Date();
    
    if (periodFilter === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (periodFilter === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      // geral = last 30 days default
      startDate.setDate(today.getDate() - 30);
    }
    // Normalize start date to beginning of day
    startDate.setHours(0, 0, 0, 0);

    return orders.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= startDate && orderDate <= today;
    });
  }, [orders, periodFilter]);

  // Chart Data Generation
  const chartData = useMemo(() => {
    const dataMap: Record<string, { date: string, demandas: number, resolucoes: number }> = {};
    
    // Initialize map with all dates in range to ensure continuous line
    const today = new Date();
    
    // Determine start date based on filter
    let startDate = new Date();
    if (periodFilter === 'week') startDate.setDate(today.getDate() - 6);
    else if (periodFilter === 'month') startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    else startDate.setDate(today.getDate() - 29);

    // Iteration to fill generic dates
    const initialDate = new Date(startDate);
    for (let d = initialDate; d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        // Format for display (DD/MM)
        const displayDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        dataMap[dateStr] = { date: displayDate, demandas: 0, resolucoes: 0 };
    }

    // Populate Demandas
    filteredOrders.forEach(o => {
        const dateStr = new Date(o.date).toISOString().split('T')[0];
        if (dataMap[dateStr]) dataMap[dateStr].demandas += 1;
    });

    // Populate Resolutions (using status 'concluido' and assuming date is order date for now, 
    // OR ideally using history log date if available. 
    // If we use order.date for resolution, it's incorrect.
    // Let's try to use history logs if available, otherwise fallback to order date if status is done (inaccurate but MVP).
    // Actually, we can check 'orders' array for 'concluido' and if it has history, use that.
    
    orders.forEach(o => {
       if (o.status === 'concluido') {
           // Find resolution date
           let resDateStr = '';
           const resLog = o.history?.find((h: any) => h.type === 'resolution');
           if (resLog && resLog.created_at) {
               resDateStr = new Date(resLog.created_at).toISOString().split('T')[0];
           } else if (resLog && resLog.details?.date) {
                // If we stored date string manually in details
                resDateStr = resLog.details.date;
           } else {
               // Fallback: use order date (not great, but better than nothing)
               resDateStr = new Date(o.date).toISOString().split('T')[0];
           }

           if (dataMap[resDateStr]) {
               dataMap[resDateStr].resolucoes += 1;
           }
       }
    });

    return Object.values(dataMap).sort(() => {
        // Sort by date logic is a bit tricky with 'DD/MM' display format. 
        // But we inserted keys chronologically YYYY-MM-DD, so Object.values might preserve it? 
        // No, key order not guaranteed.
        // Let's assume the order of insertion in for-loop helps, but to be safe we can use an array instead of map if needed.
        // Actually, let's return Object.entries sorted by Key (YYYY-MM-DD)
        return 0; // The map keys are YYYY-MM-DD, we can sort entries below.
    });
    
    // Creating array from map properly
    return Object.keys(dataMap).sort().map(key => dataMap[key]);

  }, [orders, filteredOrders, periodFilter]);


  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const open = filteredOrders.filter(o => o.status === 'aberto').length;
    // const inProgress = filteredOrders.filter(o => o.status === 'em_andamento').length; // Unused
    const completed = filteredOrders.filter(o => o.status === 'concluido').length;

    return [
      { label: 'Total de Ordens', value: total.toString(), icon: RotateCcw, color: 'blue' as const, description: 'No período' },
      { label: 'Em Aberto', value: open.toString(), icon: AlertCircle, color: 'orange' as const, description: 'Aguardando' },
      { label: 'Concluídas', value: completed.toString(), icon: CheckCircle2, color: 'green' as const, description: 'Finais' },
    ];
  }, [filteredOrders]);

  // Calculate top creators dynamically
  const topCreators = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(order => {
      counts[order.requester] = (counts[order.requester] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, count], index) => ({ id: index.toString(), name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders]);

  const topSolvers = useMemo(() => {
    const counts: Record<string, number> = {};
    // Iterate over ALL orders to find resolutions that happened IN THIS PERIOD, 
    // regardless of when the order was created? 
    // Or just filter orders created in this period? 
    // Usually "Top Solvers" implies work done in this period.
    // Let's strictly use filteredOrders for now to match other stats (created in period).
    // Or we can be smarter and check resolution logs date. 
    // Simpler: Use filteredOrders (Top Solvers for orders created in this period).
    
    filteredOrders.forEach(order => {
      const resolutionLog = order.history?.find((h: any) => h.type === 'resolution');
      if (resolutionLog && resolutionLog.details?.resolver) {
         const resolver = resolutionLog.details.resolver;
         counts[resolver] = (counts[resolver] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count], index) => ({ id: index.toString(), name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders]);

  // ... (dashboard stats logic)
  const [dailyPending, setDailyPending] = useState(true); // Assume pending until checked
  const checkDaily = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
          .from('daily_tasks_log')
          .select('*', { count: 'exact', head: true })
          .eq('date', today);
      
      // Also check readings? For simplicity check task log count. If 0 tasks logged, show alert.
      // Better: User needs to log at least one thing to dismiss? 
      // Or check specific critical tasks?
      // Let's assume if ANY log entry exists for today, they started/did it.
      if (count && count > 0) setDailyPending(false);
  };
  
  useEffect(() => {
      checkDaily();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Olá, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500">Aqui está o resumo da operação hoje.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Daily Routine Alert */}
      {dailyPending && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
              <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                      <AlertTriangle size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-orange-800">Rotina de Hoje Pendente</h3>
                      <p className="text-sm text-orange-600">Lembre-se de registrar as atividades e medições diárias.</p>
                  </div>
              </div>
              <Link to="/daily" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors flex items-center gap-1 shadow-sm">
                  Iniciar Rotina <ArrowRight size={16} />
              </Link>
          </div>
      )}

      {/* Status Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 gap-4 md:gap-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Visão Geral</h1>
          <p className="text-sm text-slate-500">Monitoramento em tempo real</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-marinho/20 text-marinho text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-marinho/20 transition-all cursor-pointer hover:border-marinho/50"
          >
            <option value="geral">Geral (30 dias)</option>
            <option value="month">Este Mês</option>
            <option value="week">Últimos 7 dias</option>
          </select>
          <button 
             onClick={() => window.location.reload()} // Simple refresh since 'realtime' is already active, but explicit refresh gives feedback
             className="bg-mata text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-mata/90 transition-colors shadow-sm"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1">
        <ActivityChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingList 
          title="Top Solicitantes (do período)" 
          items={topCreators} 
          type="creators"
        />
        <RankingList 
          title="Top Técnicos (Eficiência)" 
          items={topSolvers} 
          type="solvers"
        />
      </div>
    </div>
  );
}
