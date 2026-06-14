import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, User, Clock, Tag, MessageSquare, CheckCircle2,
  Send, Monitor, AlertCircle, Pause, XCircle, Loader2, Wrench, Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  buscarChamado, atualizarStatus, adicionarAtualizacao, deletarChamado
} from '../../lib/tiService';
import type { TiChamadoCompleto, TiStatus, TiTipoAtualizacao } from '../../types/ti';

export function TiChamadoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isTiTecnico } = useAuth();
  const { addNotification } = useNotifications();

  const [chamado, setChamado] = useState<TiChamadoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<TiTipoAtualizacao>('comentario');
  const [enviandoMsg, setEnviandoMsg] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [novoStatus, setNovoStatus] = useState<TiStatus | ''>('');
  const [statusMsg, setStatusMsg] = useState('');
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const res = await buscarChamado(id);
      if (res.sucesso && res.dados) {
        setChamado(res.dados);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleEnviarMensagem = async () => {
    if (!id || !user?.id || !novaMensagem.trim()) return;
    setEnviandoMsg(true);
    const res = await adicionarAtualizacao(id, novaMensagem, tipoMensagem, user.id);
    if (res.sucesso) {
      addNotification({ title: 'Atualização adicionada', message: 'Mensagem registrada no chamado.', type: 'success' });
      setNovaMensagem('');
      // Refresh
      const refresh = await buscarChamado(id);
      if (refresh.sucesso && refresh.dados) setChamado(refresh.dados);
    } else {
      addNotification({ title: 'Erro', message: res.erro || 'Erro ao enviar.', type: 'error' });
    }
    setEnviandoMsg(false);
  };

  const handleAlterarStatus = async () => {
    if (!id || !user?.id || !novoStatus) return;
    setAlterandoStatus(true);
    const res = await atualizarStatus(id, novoStatus, statusMsg || `Status alterado para ${novoStatus}`, user.id);
    if (res.sucesso) {
      addNotification({ title: 'Status atualizado', message: `Chamado agora está: ${novoStatus}`, type: 'success' });
      setNovoStatus('');
      setStatusMsg('');
      const refresh = await buscarChamado(id);
      if (refresh.sucesso && refresh.dados) setChamado(refresh.dados);
    } else {
      addNotification({ title: 'Erro', message: res.erro || 'Erro ao atualizar.', type: 'error' });
    }
    setAlterandoStatus(false);
  };

  const handleDeletar = async () => {
    if (!id || !user) return;
    if (!confirm('ATENÇÃO: Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita e apagará todo o histórico.')) return;
    
    setDeletando(true);
    const res = await deletarChamado(id);
    if (res.sucesso) {
      addNotification({ title: 'Chamado Excluído', message: 'O chamado foi removido do sistema.', type: 'success' });
      navigate('/ti/chamados');
    } else {
      addNotification({ title: 'Erro ao excluir', message: res.erro || 'Erro desconhecido', type: 'error' });
      setDeletando(false);
    }
  };

  const formatChamadoId = (numero: number) => `TI${numero.toString().padStart(4, '0')}`;

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusConfig = (status: TiStatus) => {
    const config: Record<TiStatus, { label: string; style: string; icon: typeof AlertCircle }> = {
      aberto: { label: 'Aberto', style: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertCircle },
      em_andamento: { label: 'Em Andamento', style: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      aguardando: { label: 'Aguardando', style: 'bg-purple-100 text-purple-800 border-purple-200', icon: Pause },
      resolvido: { label: 'Resolvido', style: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      fechado: { label: 'Fechado', style: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
    };
    return config[status] || config.aberto;
  };

  const getPriorityStyle = (p: string) => {
    const styles: Record<string, string> = {
      baixa: 'bg-green-100 text-green-700 border-green-200',
      media: 'bg-blue-100 text-blue-700 border-blue-200',
      alta: 'bg-orange-100 text-orange-700 border-orange-200',
      urgente: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[p] || styles.media;
  };

  const getUpdateIcon = (tipo: string) => {
    switch (tipo) {
      case 'status_alterado': return <Wrench size={14} className="text-blue-600" />;
      case 'solucao': return <CheckCircle2 size={14} className="text-green-600" />;
      default: return <MessageSquare size={14} className="text-slate-500" />;
    }
  };

  const getUpdateBg = (tipo: string) => {
    switch (tipo) {
      case 'status_alterado': return 'bg-blue-500';
      case 'solucao': return 'bg-green-500';
      default: return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-marinho" size={32} />
      </div>
    );
  }

  if (!chamado) {
    return <div className="p-8 text-center text-slate-500">Chamado não encontrado.</div>;
  }

  const stsCfg = getStatusConfig(chamado.status);
  const StsIcon = stsCfg.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/ti/chamados')}
          className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
            <Monitor size={20} className="text-marinho" />
            Chamado {formatChamadoId(chamado.numero)}
            <span className={cn('text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border flex items-center gap-1', stsCfg.style)}>
              <StsIcon size={12} />
              {stsCfg.label}
            </span>
          </h1>
          <p className="text-sm text-marinho/60">Detalhes do chamado de suporte técnico</p>
        </div>
        
        {isTiTecnico() && (
          <button
            onClick={handleDeletar}
            disabled={deletando}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md text-sm font-bold transition-colors disabled:opacity-50 ml-auto"
          >
            {deletando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="hidden sm:inline">Excluir</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Chamado Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{chamado.titulo}</h2>

            {chamado.descricao && (
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Descrição</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line">{chamado.descricao}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {chamado.categoria && (
                <div className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                  <Tag size={12} />
                  {chamado.categoria.nome}
                </div>
              )}
              <div className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-bold uppercase', getPriorityStyle(chamado.prioridade))}>
                <AlertCircle size={12} />
                {chamado.prioridade}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">
              Histórico ({chamado.atualizacoes.length})
            </h3>

            {chamado.atualizacoes.length > 0 ? (
              <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                {chamado.atualizacoes.map((at) => (
                  <div key={at.id} className="relative animate-in slide-in-from-left-2 duration-500">
                    <div className={cn('absolute -left-[21px] top-0 w-3 h-3 rounded-full ring-4 ring-white', getUpdateBg(at.tipo))} />

                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-slate-500">{formatDateTime(at.criado_em)}</p>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide flex items-center gap-1">
                        {getUpdateIcon(at.tipo)}
                        {at.tipo === 'comentario' ? 'Comentário' : at.tipo === 'solucao' ? 'Solução' : 'Status'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700">{at.mensagem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <MessageSquare size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhuma atualização ainda.</p>
              </div>
            )}
          </div>

          {/* Add Comment */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Adicionar Atualização</h3>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTipoMensagem('comentario')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-md border transition-all',
                  tipoMensagem === 'comentario'
                    ? 'bg-marinho text-white border-marinho'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-marinho/30'
                )}
              >
                Comentário
              </button>
              {isTiTecnico() && (
                <button
                  type="button"
                  onClick={() => setTipoMensagem('solucao')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold rounded-md border transition-all',
                    tipoMensagem === 'solucao'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-green-300'
                  )}
                >
                  Solução
                </button>
              )}
            </div>

            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho resize-none transition-all placeholder:text-slate-400"
              placeholder="Escreva sua mensagem..."
              value={novaMensagem}
              onChange={e => setNovaMensagem(e.target.value)}
            />

            <div className="flex justify-end mt-3">
              <button
                onClick={handleEnviarMensagem}
                disabled={enviandoMsg || !novaMensagem.trim()}
                className="bg-marinho text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-marinho/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviandoMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Info Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Solicitante</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="p-1.5 bg-blue-100 rounded-full">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-900 block">{chamado.solicitante.full_name}</span>
                  <span className="text-[10px] text-slate-400">{chamado.solicitante.email}</span>
                </div>
              </div>
            </div>

            {chamado.tecnico && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Técnico Responsável</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="p-1.5 bg-green-100 rounded-full">
                    <Wrench size={16} className="text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-900 block">{chamado.tecnico.full_name}</span>
                    <span className="text-[10px] text-slate-400">{chamado.tecnico.email}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Criado em</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-900">
                    {new Date(chamado.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              {chamado.resolvido_em && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Resolvido em</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-sm text-slate-900">
                      {new Date(chamado.resolvido_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Change (Técnico only) */}
          {isTiTecnico() && chamado.status !== 'fechado' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Alterar Status</h3>

              <select
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-white"
                value={novoStatus}
                onChange={e => setNovoStatus(e.target.value as TiStatus)}
              >
                <option value="">Selecione...</option>
                {chamado.status !== 'em_andamento' && <option value="em_andamento">Em Andamento</option>}
                {chamado.status !== 'aguardando' && <option value="aguardando">Aguardando</option>}
                {chamado.status !== 'resolvido' && <option value="resolvido">Resolvido</option>}
                <option value="fechado">Fechado</option>
              </select>

              {novoStatus && (
                <>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho"
                    placeholder="Motivo da alteração (opcional)"
                    value={statusMsg}
                    onChange={e => setStatusMsg(e.target.value)}
                  />
                  <button
                    onClick={handleAlterarStatus}
                    disabled={alterandoStatus}
                    className="w-full bg-mata text-white py-2.5 rounded-md text-sm font-bold hover:bg-mata/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {alterandoStatus ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Confirmar Alteração
                  </button>
                </>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {isTiTecnico() && chamado.status === 'aberto' && (
            <button
              onClick={async () => {
                setAlterandoStatus(true);
                await atualizarStatus(chamado.id, 'em_andamento', `Chamado assumido por ${user?.name}`, user?.id || '');
                const refresh = await buscarChamado(chamado.id);
                if (refresh.sucesso && refresh.dados) setChamado(refresh.dados);
                setAlterandoStatus(false);
                addNotification({ title: 'Chamado assumido', message: 'Você assumiu este chamado.', type: 'success' });
              }}
              disabled={alterandoStatus}
              className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium py-2.5 px-4 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {alterandoStatus ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
              Assumir Chamado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
