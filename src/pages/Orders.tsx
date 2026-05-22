import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, AlertCircle, CheckCircle2, Clock, Eye, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { cn, formatOrderId } from '../lib/utils';

import { PRIORITIES, LOCATION_DATA } from '../data/locations';
import { useOrders } from '../contexts/OrdersContext';

const PAGE_SIZE = 20;

export function Orders() {
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    priority: '',
    date: '',
    location: '',
    status: '',
  });

  const resetPage = useCallback(() => setCurrentPage(1), []);
  const handleSearch = (val: string) => { setSearchTerm(val); resetPage(); };
  const handleFilter = (key: string, val: string) => { setFilters(f => ({ ...f, [key]: val })); resetPage(); };

  const allFiltered = useMemo(() => {
    return orders.filter(order => {
      const formattedId = order.short_id ? formatOrderId(order.short_id) : (order.id || '');
      const matchesSearch = (order.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (order.requester || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            formattedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filters.priority ? order.priority === filters.priority : true;
      const matchesDate = filters.date ? order.date === filters.date : true;
      const matchesLocation = filters.location ? order.location === filters.location : true;
      const matchesStatus = filters.status ? order.status === filters.status : true;

      return matchesSearch && matchesPriority && matchesDate && matchesLocation && matchesStatus;
    }).sort((a, b) => {
      const scoreA = a.gut_score || 0;
      const scoreB = b.gut_score || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime();
    });
  }, [searchTerm, filters, orders]);

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const filteredOrders = allFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITIES.find(p => p.value === priority);
    if (!priorityConfig) return 'bg-slate-100 text-slate-800';
    return cn(priorityConfig.color, "border-transparent");
  };

  const renderPriorityOrGut = (order: any) => {
    const score = order.gut_score;
    if (score && score > 0) {
      let colorClass = "bg-blue-100 text-blue-800 border-blue-200";
      if (score >= 64) colorClass = "bg-red-100 text-red-800 border-red-200";
      else if (score >= 27) colorClass = "bg-orange-100 text-orange-800 border-orange-200";
      else if (score >= 12) colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";

      return (
        <span className={cn("px-2 py-1 rounded-md text-xs font-bold border", colorClass)} title={`G: ${order.gut_g} U: ${order.gut_u} T: ${order.gut_t}`}>
          GUT: {score}
        </span>
      );
    }
    
    // Fallback for old orders
    return (
      <span className={cn("px-2 py-1 rounded-md text-xs font-semibold border uppercase tracking-wide", getPriorityBadge(order.priority))}>
        {order.priority}
      </span>
    );
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
        <div className="hidden md:flex items-center gap-2">
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
        <div className="relative col-span-1 md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por ID, título..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-slate-50"
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <select
          className="hidden md:block w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filters.priority}
          onChange={e => handleFilter('priority', e.target.value)}
        >
          <option value="">Todas Prioridades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>

        {/* Status Filter */}
        <select
          className="hidden md:block w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filters.status}
          onChange={e => handleFilter('status', e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
        </select>

        {/* Location Filter */}
        <div className="hidden md:block relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
            value={filters.location}
            onChange={e => handleFilter('location', e.target.value)}
          >
            <option value="">Todos os Locais</option>
            {Object.keys(LOCATION_DATA).map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">ID / Título</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Solicitante</th>
                <th className="px-6 py-4">Prioridade (GUT)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{order.title || 'Solicitação sem título'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{order.short_id ? formatOrderId(order.short_id) : (order.id || '').substring(0,8)} • {order.date ? new Date(order.date).toLocaleDateString('pt-BR') : 'Data não def.'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{order.location}</div>
                      <div className="text-xs text-slate-400">{order.sector}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {(order.requester || '?').charAt(0)}
                        </div>
                        <span className="text-slate-600">{order.requester || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderPriorityOrGut(order)}
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
                        onClick={() => {setFilters({priority: '', date: '', location: '', status: ''}); setSearchTerm(''); resetPage();}}
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

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
            {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                    <Link to={`/orders/${order.id}`} key={order.id} className="block p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                {renderPriorityOrGut(order)}
                                <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{order.title}</h3>
                            </div>
                            {getStatusBadge(order.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-500 mt-3">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-400" />
                                {new Date(order.date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                    {order.short_id ? formatOrderId(order.short_id) : order.id.substring(0,6)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                {order.location} <span className="text-slate-300">•</span> {order.sector}
                            </div>
                        </div>
                    </Link>
                ))
            ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-50">
                    <Filter size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">Nenhum resultado.</p>
                </div>
            )}
        </div>

        
        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, allFiltered.length)} de {allFiltered.length} resultados</span>
          <div className="flex items-center gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === '...' ? (
                  <span key={`e-${i}`} className="px-2 text-slate-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item as number)}
                    className={cn(
                      'w-7 h-7 rounded border text-xs font-medium transition-colors',
                      safePage === item
                        ? 'bg-marinho text-white border-marinho'
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                    )}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
