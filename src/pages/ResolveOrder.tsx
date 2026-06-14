import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Calendar, Clock, User, Package, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadOrderPhoto, formatOrderId } from '../lib/utils';
import { useNotifications } from '../contexts/NotificationContext';
import { useOrders } from '../contexts/OrdersContext';
import imageCompression from 'browser-image-compression';
export function ResolveOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canManageUsers } = useAuth();
  const { addNotification } = useNotifications();
  const { orders, fetchOrders } = useOrders();
  const order = orders.find(o => o.id === id);
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
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

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Apenas imagens são aceitas (JPG, PNG, HEIC).');
      return;
    }
    // Validate size (max 20MB before compression)
    if (file.size > 20 * 1024 * 1024) {
      setPhotoError('Arquivo muito grande. Máximo 20 MB.');
      return;
    }

    setPhotoError(null);
    setCompressing(true);

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      const compressedFileObj = new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: Date.now(),
      });

      setPhotoFile(compressedFileObj);

      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(compressedFileObj);
    } catch (error) {
      console.error('Error compressing image:', error);
      // Fallback: use original
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      addNotification({
        title: 'Ordem Excluída',
        message: 'A ordem de serviço foi apagada com sucesso.',
        type: 'success'
      });
      fetchOrders();
      navigate('/orders');
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      addNotification({
        title: 'Erro ao excluir',
        message: 'Ocorreu um erro ao apagar a ordem.',
        type: 'error'
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-marinho">
            Finalizar Chamado #{order ? (order.short_id ? formatOrderId(order.short_id) : order.id.substring(0,8)) : id?.substring(0,8)}
          </h1>
          <p className="text-sm text-marinho/60">Preencha os dados da resolução para fechar a ordem de serviço.</p>
        </div>
        
        {canManageUsers() && (
          <div className="relative">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md text-sm font-bold transition-colors"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            ) : (
              <div className="absolute right-0 top-0 bg-white border border-red-200 rounded-lg shadow-lg p-3 w-64 z-10 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <p className="text-xs font-bold text-slate-800 mb-2">Excluir chamado permanentemente?</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    className="flex-1 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50 font-medium"
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleDeleteOrder} 
                    className="flex-1 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-bold flex justify-center items-center gap-1"
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : null}
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
              {compressing ? (
                <div className="flex-1 border-2 border-dashed border-blue-300 rounded-lg p-6 flex flex-col items-center justify-center text-blue-500 h-32 bg-blue-50/30 animate-pulse">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-sm font-medium">Comprimindo imagem...</span>
                  <span className="text-xs text-blue-400 mt-1">Otimizando para envio</span>
                </div>
              ) : photoPreview ? (
                <div className="relative w-full h-48 md:w-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs py-1 px-2 text-center">
                    {photoFile ? `${(photoFile.size / 1024).toFixed(0)} KB` : ''}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex-1 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:border-marinho hover:text-marinho hover:bg-areia/20 cursor-pointer transition-all h-32">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm font-medium">Clique para adicionar foto</span>
                  <span className="text-xs mt-1 text-slate-300">JPG, PNG, HEIC — máx. 20 MB</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>
            {photoError && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <span className="font-bold">⚠</span> {photoError}
              </p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading || compressing}
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || compressing}
            className="flex items-center gap-2 px-6 py-2 bg-mata hover:bg-mata/90 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> {photoFile ? 'Enviando foto...' : 'Salvando...'}</>
            ) : compressing ? (
              <><Loader2 size={18} className="animate-spin" /> Processando foto...</>
            ) : (
              <><Save size={18} /> Concluir Chamado</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
