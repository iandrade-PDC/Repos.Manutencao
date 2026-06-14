import { useState, useEffect } from 'react';
import {
  BarChart3, Clock, AlertTriangle, CheckCircle2, Monitor,
  TrendingUp, Loader2, AlertCircle, Copy
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../contexts/NotificationContext';
import { gerarRelatorio } from '../../lib/tiService';
import type { TiRelatorio } from '../../types/ti';

export function TiRelatorios() {
  const { addNotification } = useNotifications();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [relatorio, setRelatorio] = useState<TiRelatorio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await gerarRelatorio(mes, ano);
      if (res.sucesso && res.dados) {
        setRelatorio(res.dados);
      }
      setLoading(false);
    }
    load();
  }, [mes, ano]);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const formatChamadoId = (numero: number) => `TI${numero.toString().padStart(4, '0')}`;

  const statusLabels: Record<string, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    aguardando: 'Aguardando',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
  };

  const statusColors: Record<string, string> = {
    aberto: 'bg-amber-500',
    em_andamento: 'bg-blue-500',
    aguardando: 'bg-purple-500',
    resolvido: 'bg-green-500',
    fechado: 'bg-slate-400',
  };

  const handleCopyReport = () => {
    if (!relatorio) return;
    
    const text = `*Relatório de TI - ${meses[mes-1]}/${ano}*
    
*Visão Geral*
Total de chamados: ${relatorio.total}
Resolvidos: ${relatorio.por_status.find(s => s.label === 'resolvido')?.total || 0}
Tempo Médio: ${relatorio.tempo_medio_horas ? relatorio.tempo_medio_horas + 'h' : '—'}
Pendentes Críticos (>48h): ${relatorio.chamados_pendentes_48h.length}

*Por Status*
${relatorio.por_status.map(s => `- ${statusLabels[s.label] || s.label}: ${s.total}`).join('\n')}

*Por Categoria*
${relatorio.por_categoria.map(c => `- ${c.label}: ${c.total}`).join('\n')}

_Gerado pelo Sistema Ancoradouro_`;

    navigator.clipboard.writeText(text);
    addNotification({ title: 'Relatório Copiado!', message: 'O resumo foi copiado para a área de transferência. Pronto para colar no WhatsApp.', type: 'success' });
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
            <BarChart3 size={24} />
            Relatórios de TI
          </h1>
          <p className="text-sm text-marinho/60">Métricas e indicadores do suporte técnico.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyReport} 
            disabled={!relatorio || loading}
            className="bg-white border border-marinho/20 text-marinho px-3 py-1.5 rounded-md text-sm font-medium hover:bg-marinho/5 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
             <Copy size={16} />
             <span className="hidden sm:inline">Copiar para WhatsApp</span>
          </button>
          
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
            className="bg-white border border-marinho/20 text-marinho text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-marinho/20 transition-all cursor-pointer"
          >
            {meses.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className="bg-white border border-marinho/20 text-marinho text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-marinho/20 transition-all cursor-pointer"
          >
            {[2025, 2026, 2027].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        </div>
      </div>

      {!relatorio ? (
        <div className="text-center py-12 text-slate-500">
          <Monitor size={32} className="mx-auto mb-2 text-slate-300" />
          <p>Não foi possível carregar o relatório.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg text-blue-600">
                  <Monitor size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{relatorio.total}</p>
                  <p className="text-xs text-slate-500 font-medium">Total no Período</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-lg text-green-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {relatorio.por_status.find(s => s.label === 'resolvido')?.total || 0}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Resolvidos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-lg text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {relatorio.tempo_medio_horas !== null ? `${relatorio.tempo_medio_horas}h` : '—'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Tempo Médio</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg', relatorio.chamados_pendentes_48h.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400')}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className={cn('text-2xl font-bold', relatorio.chamados_pendentes_48h.length > 0 ? 'text-red-600' : 'text-slate-800')}>
                    {relatorio.chamados_pendentes_48h.length}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Pendentes &gt;48h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Por Status */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-marinho" />
                Chamados por Status
              </h3>

              {relatorio.por_status.length > 0 ? (
                <div className="space-y-3">
                  {relatorio.por_status.map(item => {
                    const pct = relatorio.total > 0 ? (item.total / relatorio.total) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-slate-700">{statusLabels[item.label] || item.label}</span>
                          <span className="text-sm font-bold text-slate-900">{item.total}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700', statusColors[item.label] || 'bg-slate-400')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Sem dados no período.</p>
              )}
            </div>

            {/* Por Categoria */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-marinho" />
                Chamados por Categoria
              </h3>

              {relatorio.por_categoria.length > 0 ? (
                <div className="space-y-3">
                  {relatorio.por_categoria
                    .sort((a, b) => b.total - a.total)
                    .map(item => {
                      const pct = relatorio.total > 0 ? (item.total / relatorio.total) * 100 : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700">{item.label}</span>
                            <span className="text-sm font-bold text-slate-900">{item.total}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-marinho transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Sem dados no período.</p>
              )}
            </div>
          </div>

          {/* Pendentes >48h */}
          {relatorio.chamados_pendentes_48h.length > 0 && (
            <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                Chamados Pendentes há mais de 48 horas ({relatorio.chamados_pendentes_48h.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Nº</th>
                      <th className="px-4 py-2">Título</th>
                      <th className="px-4 py-2">Prioridade</th>
                      <th className="px-4 py-2">Horas Aberto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {relatorio.chamados_pendentes_48h.map(c => (
                      <tr key={c.id} className="hover:bg-red-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{formatChamadoId(c.numero)}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{c.titulo}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-bold uppercase',
                            c.prioridade === 'urgente' ? 'bg-red-100 text-red-700' :
                            c.prioridade === 'alta' ? 'bg-orange-100 text-orange-700' :
                            c.prioridade === 'media' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            {c.prioridade}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-red-600 font-bold">{c.horas_aberto}h</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
