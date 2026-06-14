import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Monitor, Type, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { abrirChamado, listarCategorias } from '../../lib/tiService';
import type { TiCategoria, TiPrioridade } from '../../types/ti';

export function TiNovoChamado() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [categorias, setCategorias] = useState<TiCategoria[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoriaId: '',
    prioridade: 'media' as TiPrioridade,
  });

  useEffect(() => {
    async function loadCategorias() {
      const res = await listarCategorias();
      if (res.sucesso && res.dados) {
        setCategorias(res.dados);
      }
    }
    loadCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const result = await abrirChamado(
        formData.titulo,
        formData.descricao,
        formData.categoriaId,
        formData.prioridade,
        user.id
      );

      if (result.sucesso && result.dados) {
        addNotification({
          title: 'Chamado Aberto',
          message: `Chamado TI${result.dados.numero.toString().padStart(4, '0')} criado com sucesso!`,
          type: 'success',
        });
        navigate('/ti/chamados');
      } else {
        addNotification({
          title: 'Erro',
          message: result.erro || 'Não foi possível abrir o chamado.',
          type: 'error',
        });
      }
    } catch {
      addNotification({
        title: 'Erro',
        message: 'Erro inesperado ao abrir chamado.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const prioridades: { value: TiPrioridade; label: string; color: string; activeColor: string }[] = [
    { value: 'baixa', label: 'Baixa', color: 'border-green-200 hover:border-green-400 text-green-700', activeColor: 'bg-green-600 text-white border-green-600 shadow-md scale-105' },
    { value: 'media', label: 'Média', color: 'border-blue-200 hover:border-blue-400 text-blue-700', activeColor: 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' },
    { value: 'alta', label: 'Alta', color: 'border-orange-200 hover:border-orange-400 text-orange-700', activeColor: 'bg-orange-500 text-white border-orange-500 shadow-md scale-105' },
    { value: 'urgente', label: 'Urgente', color: 'border-red-200 hover:border-red-400 text-red-700', activeColor: 'bg-red-600 text-white border-red-600 shadow-md scale-105' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-20 md:pb-0">

      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={() => navigate('/ti/chamados')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-marinho flex items-center gap-2">
            <Monitor size={22} />
            Novo Chamado de TI
          </h1>
          <p className="text-xs md:text-sm text-slate-500">Descreva o problema para a equipe de suporte.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-100 space-y-6">

        {/* Categoria */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categorias.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, categoriaId: cat.id })}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all',
                  formData.categoriaId === cat.id
                    ? 'border-marinho bg-marinho/5 ring-2 ring-marinho/20'
                    : 'border-slate-200 hover:border-marinho/30 hover:bg-slate-50'
                )}
              >
                <p className={cn(
                  'text-sm font-bold',
                  formData.categoriaId === cat.id ? 'text-marinho' : 'text-slate-700'
                )}>
                  {cat.nome}
                </p>
                {cat.descricao && (
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{cat.descricao}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Prioridade */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-orange-50 text-orange-600">
              <AlertTriangle size={18} />
            </div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prioridade</h2>
          </div>

          <div className="flex gap-3">
            {prioridades.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setFormData({ ...formData, prioridade: p.value })}
                className={cn(
                  'flex-1 py-2.5 text-sm font-bold rounded-lg border-2 transition-all',
                  formData.prioridade === p.value
                    ? p.activeColor
                    : cn('bg-white', p.color)
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Título e Descrição */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalhes</h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 ml-1">Título do Problema</label>
            <div className="relative group">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-marinho transition-colors" size={18} />
              <input
                type="text"
                required
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all"
                placeholder="Ex: Computador não liga, Internet caiu..."
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 ml-1">Descrição Detalhada</label>
            <textarea
              required
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho resize-none transition-all placeholder:text-slate-400"
              placeholder="Descreva o problema com detalhes: o que aconteceu, quando começou, qual equipamento..."
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
        </div>

        {/* Solicitante info */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <p className="text-xs text-slate-500">
            <span className="font-bold text-slate-600">Solicitante:</span> {user?.name} ({user?.email})
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse md:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/ti/chamados')}
            className="w-full md:w-auto px-4 py-3 md:py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto bg-marinho text-white px-6 py-3 md:py-2.5 rounded-lg font-bold hover:bg-marinho/90 transition-all shadow-lg shadow-marinho/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {isSubmitting ? 'Enviando...' : 'Abrir Chamado'}
          </button>
        </div>
      </form>
    </div>
  );
}
