import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Calendar, Clock, MessageSquare, CheckCircle2, Package, ImageIcon, Printer } from 'lucide-react';
import { cn, formatOrderId } from '../lib/utils';
import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import { useOrders } from '../contexts/OrdersContext';

export function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEditDemands } = useAuth();
  const { orders, loading } = useOrders();
  
  const foundOrder = useMemo(() => orders.find(o => o.id === id), [orders, id]);

  // Local state to handle optimistic updates or if we want to edit locally before save (though this view is mostly read-only)
  // We initialize with foundOrder if available.
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [foundOrder]);

  // Check for updates from ResolveOrder page
  useEffect(() => {
    if (location.state?.updatedOrder) {
      const { status, resolution } = location.state.updatedOrder;
      
      setOrder((prev: any) => {
        if (!prev) return prev;
        // Prevent duplicate history entries if strict mode runs twice
        if (prev.status === 'concluido') return prev;

        return {
          ...prev,
          status: status,
          history: [
            {
              type: 'resolution',
              date: resolution.date,
              time: resolution.time,
              title: 'Chamado Finalizado',
              description: `Resolvido por ${resolution.resolver}`,
              details: resolution,
              iconBg: 'bg-mata'
            },
            ...prev.history, // Newest first
          ]
        };
      });
    }
  }, [location.state]);

  if (loading) {
     return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-slate-500">Solicitação não encontrada.</div>;
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'baixa': return 'bg-mata/20 text-mata border border-mata/30';
      case 'media': return 'bg-marinho/10 text-marinho border border-marinho/20';
      case 'alta': return 'bg-palha/20 text-palha border border-palha/30';
      case 'urgente': return 'bg-rosa/20 text-rosa border border-rosa/30';
      default: return 'bg-areia text-marinho';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/orders')}
          className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Solicitação #{order.short_id ? formatOrderId(order.short_id) : order.id.substring(0,8)}
            <span className={cn("text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border", 
              order.status === 'aberto' ? "bg-palha/20 text-palha border-palha/30" : 
              order.status === 'concluido' ? "bg-mata/20 text-mata border-mata/30" : 
              "bg-marinho/10 text-marinho border-marinho/20"
            )}>
              {order.status.replace('_', ' ')}
            </span>
          </h1>
          <p className="text-sm text-marinho/60">Detalhes completos da ordem de serviço</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{order.title}</h2>
            
            <div className="prose prose-sm text-slate-600 mb-6">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Descrição do Problema</h3>
              <p>{order.description}</p>
            </div>

            <div className="flex flex-wrap gap-4 mt-6">
              {order.photos.map((photo, i) => (
                <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={photo} alt="Evidência" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
              ))}
            </div>
          </div>

          {/* History / Updates */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">Histórico de Atualizações</h3>
            <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
              
              {/* Map through history */}
              {order.history.map((item, index) => (
                <div key={index} className="relative animate-in slide-in-from-left-2 duration-500">
                  <div className={cn("absolute -left-[21px] top-0 w-3 h-3 rounded-full ring-4 ring-white", item.iconBg || 'bg-slate-300')} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <p className="text-xs text-slate-500">{item.date} às {item.time}</p>
                    {item.type === 'resolution' && (
                       <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide w-fit">Resolvido</span>
                    )}
                  </div>
                  
                  <p className="text-base font-bold text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-600 font-medium">{item.description}</p>

                  {/* Render Extra Details for Resolution */}
                  {item.details && (
                    <div className="mt-3 bg-slate-50 rounded-md border border-slate-200 p-3 space-y-2 text-sm">
                       {/* Materials */}
                       {item.details.materials && (
                         <div className="flex items-start gap-2 text-slate-600">
                           <Package size={16} className="shrink-0 mt-0.5 text-marinho" />
                           <span>
                             <strong className="text-slate-800">Materiais:</strong> {item.details.materials}
                           </span>
                         </div>
                       )}

                       {/* Observations */}
                       {item.details.observations && (
                         <div className="flex items-start gap-2 text-slate-600">
                           <MessageSquare size={16} className="shrink-0 mt-0.5 text-marinho" />
                           <span>
                             <strong className="text-slate-800">Obs:</strong> {item.details.observations}
                           </span>
                         </div>
                       )}

                       {/* Resolution Photo */}
                       {item.details.photo && (
                         <div className="mt-2">
                            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
                               <ImageIcon size={16} className="text-marinho" />
                               Foto da Finalização:
                            </div>
                            <img src={item.details.photo} alt="Foto da Solução" className="w-full max-w-xs rounded-lg border border-slate-200 shadow-sm" />
                         </div>
                       )}
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Solicitante</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="p-1.5 bg-slate-100 rounded-full">
                  <User size={16} className="text-slate-600" />
                </div>
                <span className="text-sm font-medium text-slate-900">{order.requester}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Data</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-900">{order.date}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Horário</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-900">{order.time}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Localização</label>
              <div className="flex items-start gap-2 mt-1">
                <MapPin size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.location}</p>
                  <p className="text-xs text-slate-500">{order.sector}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Prioridade</label>
              <div className="mt-1">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", getPriorityColor(order.priority))}>
                  {order.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
             <button 
                onClick={() => navigate(`/orders/${id}/resolve`)}
                disabled={order.status === 'concluido' || !canEditDemands()}
                className="w-full bg-mata hover:bg-mata/90 text-white font-medium py-3 px-4 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <CheckCircle2 size={18} />
               {order.status === 'concluido' ? 'Ordem Resolvida' : 'Resolver Ordem'}
             </button>
             
             {/* Print Button (Optional but kept for completeness if needed) */}
             {/* 
             <button 
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md border border-slate-200 shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimir Ordem
              </button>
              */}
          </div>
        </div>

      </div>
    </div>
  );
}
