import { useState, useEffect } from 'react';
import { Camera, Send, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { LOCATION_DATA, PRIORITIES } from '../data/locations';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

import { useOrders } from '../contexts/OrdersContext';
import { ArrowLeft } from 'lucide-react';

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
    priority: 'baixa',
    title: '',
    description: ''
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
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
        description: ''
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-marinho">Nova Solicitação</h1>
          <p className="text-slate-500">Preencha os dados abaixo para abrir um chamado.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
            <input 
              type="date" 
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-marinho focus:border-transparent bg-slate-50 text-slate-600"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
            <input 
              type="time" 
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-marinho focus:border-transparent bg-slate-50 text-slate-600"
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Solicitante</label>
          <input 
            type="text" 
            disabled
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-marinho focus:border-transparent bg-slate-100 text-slate-500"
            value={formData.requester}
            readOnly
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
            <select 
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-marinho focus:border-transparent"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            >
              <option value="">Selecione...</option>
              {Object.keys(LOCATION_DATA).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Setor / Ambiente Específico</label>
            <select
               required
               disabled={!formData.location}
               className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-marinho focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
               value={formData.sector}
               onChange={e => setFormData({...formData, sector: e.target.value})}
            >
              <option value="">{formData.location ? "Selecione o setor..." : "Primeiro selecione a localização"}</option>
              {availableSectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Section: Details */}
        <div className="pt-4 border-t border-slate-100 space-y-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle size={16} className="text-blue-600" />
            Detalhes da Ocorrência
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Prioridade</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <label key={p.value} className={cn(
                    "flex-1 text-center py-2 px-3 rounded-md border text-sm cursor-pointer transition-all select-none",
                    formData.priority === p.value
                      ? cn(p.color, "border-transparent ring-2 ring-offset-1 ring-blue-500 font-bold")
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}>
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p.value} 
                      className="hidden"
                      checked={formData.priority === p.value}
                      onChange={() => setFormData({...formData, priority: p.value})}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Título / Resumo</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Vazamento na pia, Lâmpada queimada..."
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Observação / Descrição Detalhada</label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descreva o problema com o máximo de detalhes possível..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

          <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">Evidência (Foto Única)</label>
              
              {!photo ? (
                <label className="w-full h-48 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-marinho hover:text-marinho hover:bg-areia/20 transition-all bg-slate-50">
                  <Camera size={32} />
                  <span className="text-sm font-bold mt-2">Adicionar Foto</span>
                  <span className="text-xs mt-1">Clique para tirar foto ou fazer upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    capture="environment"
                    onChange={handlePhotoUpload}
                  />
                </label>
              ) : (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200 group bg-black/5">
                  <img 
                    src={URL.createObjectURL(photo)} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-white text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-marinho text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-marinho/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            {isSubmitting ? 'Enviando...' : 'Registrar Solicitação'}
          </button>
        </div>
      </form>
    </div>
  );
}
