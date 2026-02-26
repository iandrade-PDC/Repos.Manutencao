import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Wrench, Clock, CheckCircle2, MapPin, FileDown, Loader2, ListTodo, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { pdf } from '@react-pdf/renderer';
import { OrderPdfDocument } from '../components/OrderPdfDocument';
import { useOrders } from '../contexts/OrdersContext';

export function ResolveList() {
  const { orders, loading } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filter by status based on tab
      const isResolved = order.status === 'concluido';
      if (activeTab === 'pending' && isResolved) return false;
      if (activeTab === 'resolved' && !isResolved) return false;

      // 2. Filter by search term
      const matchesSearch = 
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.short_id && `OS${order.short_id}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    }).sort((a, b) => {
      const scoreA = a.gut_score || 0;
      const scoreB = b.gut_score || 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime();
    });
  }, [orders, activeTab, searchTerm]);

  const getGutPriorityInfo = (order: any) => {
    const score = order.gut_score;
    if (score && score > 0) {
      if (score >= 64) return { color: 'bg-red-100 text-red-800 border-red-200', label: `GUT: ${score}` };
      if (score >= 27) return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: `GUT: ${score}` };
      if (score >= 12) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: `GUT: ${score}` };
      return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: `GUT: ${score}` };
    }
    
    // Fallback
    const map = {
      baixa: { color: 'bg-green-100 text-green-700', label: 'Baixa' },
      media: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
      alta: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
      urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
    };
    return map[order.priority as keyof typeof map] || map.baixa;
  };

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const handleDownloadPdf = async (order: any) => {
    try {
      setGeneratingPdfId(order.id);
      
      const blob = await pdf(<OrderPdfDocument order={order} />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ordem_servico_${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marinho">Central de Soluções</h1>
          <p className="text-sm text-marinho/60">Gerencie atendimentos e histórico de resoluções.</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar chamado..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-marinho/20 text-sm focus:outline-none focus:ring-2 focus:ring-marinho/20 text-marinho bg-white placeholder-marinho/40"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'pending' 
              ? "border-marinho text-marinho" 
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <ListTodo size={18} />
          Pendentes
          {orders.filter(o => o.status !== 'concluido').length > 0 && (
            <span className="ml-1 bg-marinho/10 text-marinho text-xs px-2 py-0.5 rounded-full">
              {orders.filter(o => o.status !== 'concluido').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'resolved' 
              ? "border-mata text-mata" 
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <History size={18} />
          Realizados / Histórico
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-marinho" />
          <p>Carregando solicitações...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const priority = getGutPriorityInfo(order);
              const isResolved = order.status === 'concluido';
              
              return (
                <div key={order.id} className={cn(
                    "bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group",
                    isResolved ? "border-slate-200" : "border-slate-200 border-l-4 border-l-marinho"
                  )}>
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                       <span className="text-xs font-mono text-slate-400">
                          {order.short_id ? `OS${order.short_id.toString().padStart(4,'0')}` : (order.id && order.id.length > 8 ? order.id.substring(0,8) + '...' : order.id)}
                       </span>
                      <div className="flex gap-2">
                        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border", priority.color)}>
                          {priority.label}
                        </span>
                        {isResolved && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                            Resolvido <CheckCircle2 size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-1 line-clamp-2" title={order.title}>{order.title}</h3>
                    
                    <div className="flex items-center gap-1 text-slate-500 text-xs mb-4">
                      <MapPin size={12} />
                      <span>{order.location} • {order.sector}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(order.date).toLocaleDateString('pt-BR')}
                      </div>
                      {order.status === 'em_andamento' && !isResolved && (
                        <span className="text-marinho font-medium flex items-center gap-1 bg-marinho/5 px-2 py-0.5 rounded">
                           Em atendimento
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-50 bg-slate-50/50 flex gap-2">
                    {/* PDF Button */}
                    <button 
                      onClick={() => handleDownloadPdf(order)}
                      disabled={generatingPdfId === order.id}
                      className="p-2 text-marinho/60 hover:text-marinho hover:bg-areia rounded-md transition-colors border border-marinho/10 bg-white"
                      title="Baixar PDF do Chamado"
                    >
                      {generatingPdfId === order.id ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                    </button>

                    {/* Pending Actions */}
                    {!isResolved && (
                      <Link 
                        to={`/orders/${order.id}/resolve`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-mata hover:bg-mata/90 text-white rounded-md transition-colors shadow-sm"
                      >
                        <Wrench size={16} />
                        Resolver
                      </Link>
                    )}

                    {/* Resolved Actions */}
                    {isResolved && (
                      <Link 
                        to={`/orders/${order.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        Ver Detalhes
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
             <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
               {activeTab === 'pending' ? (
                 <>
                   <CheckCircle2 size={48} className="mx-auto text-green-200 mb-2" />
                   <p className="font-medium text-slate-900">Tudo limpo por aqui!</p>
                   <p className="text-sm">Não há chamados pendentes no momento.</p>
                 </>
               ) : (
                 <>
                   <History size={48} className="mx-auto text-slate-200 mb-2" />
                   <p className="font-medium text-slate-900">Nenhum histórico</p>
                   <p className="text-sm">Nenhum chamado foi resolvido ainda.</p>
                 </>
               )}
             </div>
          )}
        </div>
      )}

    </div>
  );
}
