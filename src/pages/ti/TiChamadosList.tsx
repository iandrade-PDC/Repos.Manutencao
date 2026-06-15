import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, AlertCircle, CheckCircle2, Clock, Eye,
  ChevronLeft, ChevronRight, Plus, Monitor, Pause, XCircle,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../lib/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import { listarChamados, listarCategorias } from '../../lib/tiService';
import type { TiChamado, TiCategoria, TiChamadoFiltros, TiStatus, TiPrioridade } from '../../types/ti';

const PAGE_SIZE = 15;

export function TiChamadosList() {
  const { user, isTiTecnico } = useAuth();
  const [chamados, setChamados] = useState<TiChamado[]>([]);
  const [categorias, setCategorias] = useState<TiCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawSearch, setRawSearch] = useState('');
  const searchTerm = useDebounce(rawSearch, 280);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TiChamadoFiltros>({ status: 'pendentes' });

  const resetPage = useCallback(() => setCurrentPage(1), []);

  const handleSearch = (val: string) => {
    setRawSearch(val);
    resetPage();
  };

  const handleFilter = (key: keyof TiChamadoFiltros, val: string) => {
    setFilters(f => ({ ...f, [key]: val || undefined }));
    resetPage();
  };

  // Fetch data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [chamadosRes, categoriasRes] = await Promise.all([
        listarChamados(filters, user?.id || '', isTiTecnico()),
        listarCategorias(),
      ]);
      if (chamadosRes.sucesso && chamadosRes.dados) {
        setChamados(chamadosRes.dados);
      }
      if (categoriasRes.sucesso && categoriasRes.dados) {
        setCategorias(categoriasRes.dados);
      }
      setLoading(false);
    }
    if (user?.id) load();
  }, [filters, user?.id]);

  // Client-side search
  const allFiltered = useMemo(() => {
    if (!searchTerm) return chamados;
    const term = searchTerm.toLowerCase();
    return chamados.filter(c =>
      c.titulo.toLowerCase().includes(term) ||
      c.numero.toString().includes(term) ||
      (c.descricao || '').toLowerCase().includes(term)
    );
  }, [chamados, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = allFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getStatusConfig = (status: TiStatus) => {
    const config: Record<TiStatus, { label: string; style: string; icon: typeof AlertCircle }> = {
      aberto: { label: 'Aberto', style: 'text-amber-700 bg-amber-100 border-amber-200', icon: AlertCircle },
      em_andamento: { label: 'Em Andamento', style: 'text-blue-700 bg-blue-100 border-blue-200', icon: Clock },
      aguardando: { label: 'Aguardando', style: 'text-purple-700 bg-purple-100 border-purple-200', icon: Pause },
      resolvido: { label: 'Resolvido', style: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle2 },
      fechado: { label: 'Fechado', style: 'text-slate-600 bg-slate-100 border-slate-200', icon: XCircle },
    };
    return config[status] || config.aberto;
  };

  const getPriorityBadge = (prioridade: TiPrioridade) => {
    const config: Record<TiPrioridade, string> = {
      baixa: 'bg-green-100 text-green-700 border-green-200',
      media: 'bg-blue-100 text-blue-700 border-blue-200',
      alta: 'bg-orange-100 text-orange-700 border-orange-200',
      urgente: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels: Record<TiPrioridade, string> = {
      baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente',
    };
    return (
      <span className={cn('px-2 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wide', config[prioridade])}>
        {labels[prioridade]}
      </span>
    );
  };

  const renderStatusBadge = (status: TiStatus) => {
    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;
    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit shadow-sm', cfg.style)}>
        <Icon size={12} />
        {cfg.label}
      </span>
    );
  };

  const formatChamadoId = (numero: number) => `TI${numero.toString().padStart(4, '0')}`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return 'Sem categoria';
    const cat = categorias.find(c => c.id === catId);
    return cat?.nome || 'Desconhecida';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-marinho" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marinho flex items-center gap-2">
            <Monitor size={24} />
            Chamados de TI
          </h1>
          <p className="text-sm text-marinho/60">
            {isTiTecnico() ? 'Gerencie todos os chamados de suporte técnico.' : 'Acompanhe seus chamados de suporte.'}
          </p>
        </div>
        <Link
          to="/ti/novo"
          className="bg-marinho text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-marinho/90 transition-colors shadow-sm flex items-center gap-2 w-fit"
        >
          <Plus size={16} />
          Novo Chamado
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="relative col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nº, título..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-slate-50"
            value={rawSearch}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        <select
          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-white"
          value={filters.status || ''}
          onChange={e => handleFilter('status', e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="pendentes">Pendentes (Abertos/Andamento)</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="aguardando">Aguardando</option>
          <option value="resolvido">Resolvido</option>
          <option value="fechado">Fechado</option>
        </select>

        <select
          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-white"
          value={filters.prioridade || ''}
          onChange={e => handleFilter('prioridade', e.target.value)}
        >
          <option value="">Todas Prioridades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>

        <select
          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-white"
          value={filters.categoria_id || ''}
          onChange={e => handleFilter('categoria_id', e.target.value)}
        >
          <option value="">Todas Categorias</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Nº / Título</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Prioridade</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.length > 0 ? (
                paginatedList.map(chamado => (
                  <tr key={chamado.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{chamado.titulo}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{formatChamadoId(chamado.numero)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{getCategoryName(chamado.categoria_id)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(chamado.prioridade)}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(chamado.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600">{formatDate(chamado.criado_em)}</div>
                      <div className="text-xs text-slate-400">{formatTime(chamado.criado_em)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/ti/chamados/${chamado.id}`}
                        className="inline-flex text-slate-400 hover:text-marinho p-2 rounded-full hover:bg-marinho/5 transition-colors"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Monitor size={32} className="text-slate-300" />
                      <p>Nenhum chamado encontrado.</p>
                      <Link to="/ti/novo" className="text-marinho hover:underline text-sm font-medium">
                        Abrir novo chamado
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedList.length > 0 ? (
            paginatedList.map(chamado => (
              <Link to={`/ti/chamados/${chamado.id}`} key={chamado.id} className="block p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    {getPriorityBadge(chamado.prioridade)}
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 mt-1">{chamado.titulo}</h3>
                  </div>
                  {renderStatusBadge(chamado.status)}
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-500 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    {formatDate(chamado.criado_em)} {formatTime(chamado.criado_em)}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {formatChamadoId(chamado.numero)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    {getCategoryName(chamado.categoria_id)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-50">
              <Monitor size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Nenhum chamado encontrado.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {allFiltered.length > 0
              ? `Mostrando ${((safePage - 1) * PAGE_SIZE) + 1}–${Math.min(safePage * PAGE_SIZE, allFiltered.length)} de ${allFiltered.length}`
              : '0 resultados'}
          </span>
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
