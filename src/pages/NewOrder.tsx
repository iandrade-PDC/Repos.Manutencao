import { useState, useEffect } from 'react';
import { Camera, Send, X, AlertTriangle, CalendarDays, Clock, MapPin, User, Type, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { LOCATION_DATA } from '../data/locations';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useOrders } from '../contexts/OrdersContext';
import imageCompression from 'browser-image-compression';
export function NewOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { addOrder } = useOrders();
  
  // Initial State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    requester: user?.name || '',
    location: '',
    sector: '',
    priority: 'baixa' as any,
    title: '',
    description: '',
    gut_g: 0,
    gut_u: 0,
    gut_t: 0
  });
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update sectors when location changes
  useEffect(() => {
    if (formData.location && LOCATION_DATA[formData.location]) {
      setAvailableSectors(LOCATION_DATA[formData.location]);
      setFormData(prev => ({ ...prev, sector: '' })); // Reset sector
    } else {
      setAvailableSectors([]);
    }
  }, [formData.location]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 0.5, // 500KB max
          maxWidthOrHeight: 1280,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        // Ensure the compressed file is treated as a File object that we can use
        const compressedFileObj = new File([compressedFile], file.name, {
          type: compressedFile.type,
          lastModified: Date.now(),
        });
        setPhoto(compressedFileObj);
      } catch (error) {
        console.error("Error compressing image:", error);
        // Fallback to original if compression fails
        setPhoto(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Create automatic title if empty, or use provided title
    const finalTitle = formData.title || (formData.description.length > 30 
      ? formData.description.substr(0, 30) + '...' 
      : formData.description);

    try {
      await addOrder({
        title: finalTitle || 'Nova Solicitação',
        description: formData.description,
        requester: formData.requester,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        sector: formData.sector,
        priority: formData.priority as any,
        gut_g: formData.gut_g > 0 ? formData.gut_g : null,
        gut_u: formData.gut_u > 0 ? formData.gut_u : null,
        gut_t: formData.gut_t > 0 ? formData.gut_t : null,
        photos: photo ? [photo] : [] // Pass single file as array
      });
      
      addNotification({
        title: 'Solicitação Registrada',
        message: `Ordem criada com sucesso! Você pode criar outra.`,
        type: 'success'
      });
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        requester: user?.name || '',
        location: '',
        sector: '',
        priority: 'baixa',
        title: '',
        description: '',
        gut_g: 0,
        gut_u: 0,
        gut_t: 0
      });
      setPhoto(null);
      setAvailableSectors([]);
      window.scrollTo(0, 0);

      // navigate('/orders'); // Removed navigation as requested
    } catch (error) {
      console.error("Error creating order:", error);
      setIsSubmitting(false);
      
      addNotification({
        title: 'Erro',
        message: 'Não foi possível salvar a solicitação. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors md:hidden"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-marinho">Nova Solicitação</h1>
          <p className="text-xs md:text-sm text-slate-500">Preencha os dados abaixo para abrir um chamado.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-100 space-y-6">
        
        {/* Basic Info Section */}
        <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informações Básicas</h2>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Data</label>
                    <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-marinho transition-colors" size={18} />
                        <input 
                        type="date" 
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all text-sm text-slate-700 font-medium"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                </div>
                <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Horário</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-marinho transition-colors" size={18} />
                        <input 
                        type="time" 
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all text-sm text-slate-700 font-medium"
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Solicitante</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        disabled
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-100/80 border border-slate-200 rounded-lg text-slate-500 font-medium text-sm focus:outline-none cursor-not-allowed"
                        value={formData.requester}
                    />
                </div>
            </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Location Section */}
        <div className="space-y-4">
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Localização</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Local Principal</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-marinho transition-colors" size={18} />
                        <select 
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all text-sm appearance-none text-slate-700"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        >
                        <option value="">Selecione o local...</option>
                        {Object.keys(LOCATION_DATA).map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l pl-2 border-slate-200">
                             <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Setor / Ambiente</label>
                    <div className="relative">
                        {/* We reuse MapPin or another icon like 'DoorOpen' if available, staying with MapPin for consistency or none */}
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate-300 group-focus-within:border-marinho transition-colors" />
                        <select
                        required
                        disabled={!formData.location}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all text-sm appearance-none disabled:bg-slate-100 disabled:text-slate-400 text-slate-700"
                        value={formData.sector}
                        onChange={e => setFormData({...formData, sector: e.target.value})}
                        >
                        <option value="">{formData.location ? "Selecione o ambiente..." : "Primeiro selecione o local"}</option>
                        {availableSectors.map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                        ))}
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l pl-2 border-slate-200">
                             <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Details Section */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                <AlertTriangle size={18} />
             </div>
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Detalhes da Ocorrência
             </h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-blue-600" />
                <label className="text-sm font-bold text-slate-800 uppercase tracking-wide">Matriz de Prioridade (GUT)</label>
              </div>

              {/* Gravidade */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Gravidade (Impacto do problema)</label>
                <div className="flex gap-2 w-full">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={`g-${val}`}
                      type="button"
                      onClick={() => setFormData({...formData, gut_g: val})}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold rounded-lg border-2 transition-all",
                        formData.gut_g === val 
                          ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105" 
                          : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 text-center">1: Sem gravidade ... 5: Extremamente grave</p>
              </div>

              {/* Urgência */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Urgência (Pressão de tempo)</label>
                <div className="flex gap-2 w-full">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={`u-${val}`}
                      type="button"
                      onClick={() => setFormData({...formData, gut_u: val})}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold rounded-lg border-2 transition-all",
                        formData.gut_u === val 
                          ? "bg-orange-500 text-white border-orange-500 shadow-md transform scale-105" 
                          : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 text-center">1: Pode esperar ... 5: Imediata</p>
              </div>

              {/* Tendência */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Tendência (Potencial de piora se demorar)</label>
                <div className="flex gap-2 w-full">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={`t-${val}`}
                      type="button"
                      onClick={() => setFormData({...formData, gut_t: val})}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold rounded-lg border-2 transition-all",
                        formData.gut_t === val 
                          ? "bg-purple-600 text-white border-purple-600 shadow-md transform scale-105" 
                          : "bg-white text-slate-500 border-slate-200 hover:border-purple-300"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 text-center">1: Não piora ... 5: Piora rapidamente</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 ml-1">Título do Problema</label>
              <div className="relative group">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-marinho transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all"
                    placeholder="Ex: Ar condicionado pingando, Tomada em curto..."
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 ml-1">Descrição Detalhada</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho resize-none transition-all placeholder:text-slate-400"
                placeholder="Descreva o problema com detalhes..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block ml-1">Evidência (Foto)</label>
              
              {!photo ? (
                <label className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-marinho hover:text-marinho hover:bg-marinho/5 transition-all bg-slate-50 group">
                  <div className="p-3 rounded-full bg-white shadow-sm mb-2 group-hover:scale-110 transition-transform">
                     <Camera size={24} className="text-marinho" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Adicionar Foto</span>
                  <span className="text-xs mt-1 text-slate-400">Toque para capturar</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                </label>
              ) : (
                <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 group bg-black">
                  <img 
                    src={URL.createObjectURL(photo)} 
                    alt="Preview" 
                    className="w-full h-full object-contain opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute top-3 right-3 bg-white/90 text-red-500 p-2 rounded-full shadow-lg hover:bg-white transition-all active:scale-95"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-3 left-3 text-white text-xs font-medium px-2 py-1 bg-black/50 rounded-md backdrop-blur-sm">
                    Foto anexada
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Sticky on Mobile? No, just clearly separated */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col-reverse md:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
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
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <Send size={18} />
            )}
            {isSubmitting ? 'Registrando...' : 'Confirmar Solicitação'}
          </button>
        </div>
      </form>
    </div>
  );
}
