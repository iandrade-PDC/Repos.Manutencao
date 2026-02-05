import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, AlertCircle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { cn, formatOrderId } from '../lib/utils';

import { PRIORITIES } from '../data/locations';
import { useOrders } from '../contexts/OrdersContext';

export function Orders() {
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priority: '',
    date: '',
    sector: '',
    status: '',
  });

  // Unique sectors for filter dropdown
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const formattedId = order.short_id ? formatOrderId(order.short_id) : order.id;
      const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            formattedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filters.priority ? order.priority === filters.priority : true;
      const matchesDate = filters.date ? order.date === filters.date : true;
      // const matchesSector = filters.sector ? order.sector === filters.sector : true; // Removed Sector Filter
      const matchesStatus = filters.status ? order.status === filters.status : true;

      return matchesSearch && matchesPriority && matchesDate && matchesStatus;
    });
  }, [searchTerm, filters]);

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITIES.find(p => p.value === priority);
    if (!priorityConfig) return 'bg-slate-100 text-slate-800'; // Default fallback

    // Map NewOrder.tsx colors to badge styles if needed, or use them directly.
    // NewOrder uses: bg-green-100 text-green-800 etc.
    // These are standard tailwind colors that look good as badges.
    // We append border-transparent to match the existing badge shape style if we want borders, 
    // or just use the color classes directly.
    return cn(priorityConfig.color, "border-transparent");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      aberto: 'text-amber-700 bg-amber-100 border-amber-200',
      em_andamento: 'text-blue-700 bg-blue-100 border-blue-200',
      concluido: 'text-green-700 bg-green-100 border-green-200',
    };
    const labels = {
      aberto: 'Aberto',
      em_andamento: 'Em Andamento',
      concluido: 'Concluído',
    };
    return (
      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit shadow-sm", styles[status as keyof typeof styles])}>
        {status === 'aberto' && <AlertCircle size={12} />}
        {status === 'em_andamento' && <Clock size={12} />}
        {status === 'concluido' && <CheckCircle2 size={12} />}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marinho">Lista de Solicitações</h1>
          <p className="text-sm text-marinho/60">Gerencie e acompanhe todas as ordens de manutenção.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="bg-white border border-marinho/20 text-marinho px-4 py-2 rounded-md text-sm font-medium hover:bg-areia/50 transition-colors shadow-sm">
            Exportar CSV
           </button>
           <button className="bg-mata text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-mata/90 transition-colors shadow-sm flex items-center gap-2">
            <Filter size={16} />
            Filtros Avançados
           </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por ID, título..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-slate-50"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <select
          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filters.priority}
          onChange={e => setFilters({...filters, priority: e.target.value})}
        >
          <option value="">Todas Prioridades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>

        {/* Status Filter (Replaces Sector) */}
        <select
          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Todos os Status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
        </select>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="date"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-500"
            value={filters.date}
            onChange={e => setFilters({...filters, date: e.target.value})}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">ID / Título</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Solicitante</th>
                <th className="px-6 py-4">Prioridade</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{order.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{order.short_id ? formatOrderId(order.short_id) : order.id.substring(0,8)} • {new Date(order.date).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{order.location}</div>
                      <div className="text-xs text-slate-400">{order.sector}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {order.requester.charAt(0)}
                        </div>
                        <span className="text-slate-600">{order.requester}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-md text-xs font-semibold border uppercase tracking-wide", getPriorityBadge(order.priority))}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/orders/${order.id}`} className="inline-flex text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors">
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={32} className="text-slate-300" />
                      <p>Nenhuma ordem encontrada com os filtros selecionados.</p>
                      <button 
                        onClick={() => {setFilters({priority: '', date: '', sector: '', status: ''}); setSearchTerm('')}}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer (Static) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {filteredOrders.length} de {orders.length} resultados</span>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-50">Anterior</button>
            <button disabled className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-50">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
