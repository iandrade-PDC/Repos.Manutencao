import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Calendar, Clock, User, Package, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadOrderPhoto, formatOrderId } from '../lib/utils';
import { useNotifications } from '../contexts/NotificationContext';
import { useOrders } from '../contexts/OrdersContext';

export function ResolveOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { orders } = useOrders();
  const order = orders.find(o => o.id === id);
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Default values
  const [formData, setFormData] = useState({
    resolverDetails: '', 
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    materials: '',
    observations: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        resolverDetails: `${user.name} - ${user.role === 'leader' ? 'Líder Manutenção' : 'Técnico'}`
      }));
    }
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        let uploadedPhotoUrl = null;

        if (photoFile) {
            uploadedPhotoUrl = await uploadOrderPhoto(photoFile);
        }

        // 1. Update Order Status
        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'concluido' })
            .eq('id', id);

        if (orderError) throw orderError;

        // 2. Create Log Entry
        const { error: logError } = await supabase
            .from('order_logs')
            .insert({
                order_id: id,
                user_id: user?.id,
                title: 'Chamado Finalizado',
                description: `Resolvido por ${user?.name || 'Técnico'}`,
                type: 'resolution',
                details: {
                    resolver: user?.name,
                    date: formData.date,
                    time: formData.time,
                    materials: formData.materials,
                    observations: formData.observations,
                    photo: uploadedPhotoUrl
                }
            });

        if (logError) throw logError;

        addNotification({
            title: 'Chamado Resolvido!',
            message: 'O status da ordem foi atualizado para concluído.',
            type: 'success'
        });

        // Navigate back to details
        navigate(`/orders/${id}`);

    } catch (error) {
        console.error('Error resolving order:', error);
        addNotification({
            title: 'Erro ao finalizar',
            message: 'Ocorreu um erro ao salvar a resolução. Tente novamente.',
            type: 'error'
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-marinho">
            Finalizar Chamado #{order ? (order.short_id ? formatOrderId(order.short_id) : order.id.substring(0,8)) : id?.substring(0,8)}
          </h1>
          <p className="text-sm text-marinho/60">Preencha os dados da resolução para fechar a ordem de serviço.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-marinho/10 shadow-sm overflow-hidden">
        
        {/* Helper Banner */}
        <div className="bg-areia border-b border-areia px-6 py-4">
           <div className="flex gap-3">
             <div className="p-2 bg-marinho/10 text-marinho rounded-lg shrink-0 h-fit">
               <User size={20} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-marinho">Responsável pela Resolução</h3>
               <p className="text-xs text-marinho/80 mt-1">
                 O sistema registrará automaticamente <strong>{user?.name}</strong> como o técnico responsável.
               </p>
             </div>
           </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Section: When */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-marinho flex items-center gap-2">
                <Calendar size={16} className="text-marinho/40" />
                Data da Finalização
              </label>
              <input 
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-slate-50"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Horário da Finalização
              </label>
              <input 
                type="time"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-slate-50"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Materials */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Package size={16} className="text-slate-400" />
              Materiais Utilizados (Opcional)
            </label>
            <textarea 
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-marinho min-h-[80px]"
              placeholder="Ex: 1 lâmpada LED 9W, 2m de fio 2.5mm..."
              value={formData.materials}
              onChange={e => setFormData({...formData, materials: e.target.value})}
            />
          </div>

          {/* Section: Details / Observations */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-slate-400" />
              Observações / Detalhes do Serviço (Opcional)
            </label>
            <textarea 
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-marinho min-h-[100px]"
              placeholder="Descreva o que foi feito para resolver o problema..."
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
            />
          </div>

          <hr className="border-slate-100" />

          {/* Section: Photo */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Foto da Finalização (Opcional)</label>
            
            <div className="flex gap-4 items-start">
              {photoPreview ? (
                <div className="relative w-full h-48 md:w-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex-1 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:border-marinho hover:text-marinho hover:bg-areia/20 cursor-pointer transition-all h-32">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm font-medium">Clique para adicionar foto</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handlePhotoChange} 
                  />
                </label>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            disabled={loading}
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-mata hover:bg-mata/90 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Concluir Chamado
          </button>
        </div>

      </form>
    </div>
  );
}
