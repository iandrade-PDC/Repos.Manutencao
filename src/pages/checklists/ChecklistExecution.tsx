

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ChecklistItem } from '../../types/checklist';
import { ChevronRight, Check, X, Camera, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadOrderPhoto } from '../../lib/utils';

export function ChecklistExecution() {
  const { id } = useParams(); // Inspection ID (if resuming)
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [results, setResults] = useState<Record<string, { status: 'ok' | 'issue', observation?: string, photo?: string }>>({});
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // Item ID being uploaded
  
  // Refs for file inputs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Group items by Area
  const areas = useMemo(() => {
    // Maintain order based on items list
    const seen = new Set();
    return items.filter(item => {
        const k = item.area;
        return seen.has(k) ? false : seen.add(k);
    }).map(i => i.area);
  }, [items]);

  const currentArea = areas[currentAreaIndex];
  const currentItems = items.filter(i => i.area === currentArea);
  const progress = items.length > 0 ? Math.round((Object.keys(results).length / items.length) * 100) : 0;

  useEffect(() => {
    loadInspectionData();
  }, [id, templateId]);

  const loadInspectionData = async () => {
    try {
      setLoading(true);
      
      let targetTemplateId = templateId;

      // If we have an Inspection ID (resuming), fetch its template first
      if (id) {
          const { data: inspection } = await supabase.from('inspections').select('template_id, status').eq('id', id).single();
          if (inspection) {
              targetTemplateId = inspection.template_id;
              // Ideally load previous results here too if resuming...
          }
      }

      if (targetTemplateId) {
          const { data, error } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('template_id', targetTemplateId)
            .order('item_order');
            
          if (error) throw error;
          setItems(data || []);
      }
    } catch (e) {
        console.error('Error loading checklist:', e);
        alert('Erro ao carregar itens da vistoria.');
    } finally {
        setLoading(false);
    }
  };

  const handleResult = (itemId: string, status: 'ok' | 'issue') => {
    setResults(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], status }
    }));
  };

  const handleObservation = (itemId: string, obs: string) => {
    setResults(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], observation: obs }
    }));
  };

  const handlePhotoUpload = async (itemId: string, file: File) => {
      try {
          setUploading(itemId);
          const publicUrl = await uploadOrderPhoto(file);

          setResults(prev => ({
              ...prev,
              [itemId]: { ...prev[itemId], photo: publicUrl }
          }));

      } catch (error) {
          console.error('Upload failed:', error);
          alert('Erro ao enviar foto. Tente novamente.');
      } finally {
          setUploading(null);
      }
  };

  const nextArea = () => {
    if (currentAreaIndex < areas.length - 1) {
        setCurrentAreaIndex(prev => prev + 1);
        window.scrollTo(0,0);
    } else {
        finishInspection();
    }
  };

  const finishInspection = async () => {
      if (submitting) return;
      setSubmitting(true);
      
      try {
          // 1. Create or Update Inspection Record
          // If we have 'id' (param), update. If not, create new.
          let inspectionId = id;

          if (!inspectionId && templateId) {
              const { data: newInsp, error: inspError } = await supabase
                  .from('inspections')
                  .insert({
                      template_id: templateId,
                      user_id: user?.id,
                      status: 'completed',
                      completed_at: new Date().toISOString()
                  })
                  .select()
                  .single();
              
              if (inspError) throw inspError;
              inspectionId = newInsp.id;
          } else if (inspectionId) {
              await supabase.from('inspections').update({
                  status: 'completed',
                  completed_at: new Date().toISOString()
              }).eq('id', inspectionId);
          }

          // 2. Process all results
          const resultEntries = Object.entries(results);
          const issues = resultEntries.filter(([_, val]) => val.status === 'issue');

          // 3. Generate Orders for Issues
          const generatedOrdersMap: Record<string, string> = {}; // ItemID -> OrderID

          for (const [itemId, result] of issues) {
              const item = items.find(i => i.id === itemId);
              if (!item) continue;

              const { data: order, error: orderError } = await supabase.from('orders').insert({
                  title: `Falha na Vistoria: ${item.description}`,
                  description: `Problema identificado. Obs: ${result.observation || 'Não informada'}`,
                  location: item.area || 'Localização Vistoria',
                  sector: 'Manutenção',
                  requester_id: user?.id,
                  requester: user?.name || 'Vistoria Check',
                  priority: 'alta', // Inspection failures are usually high priority
                  status: 'aberto',
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  photos: result.photo ? [result.photo] : [], // Add photo to order
                  type: 'preventiva' // If you have 'type' column, good to mark it
              }).select().single();

              if (!orderError && order) {
                  generatedOrdersMap[itemId] = order.id;
              }
          }

          // 4. Save Inspection Results Linkage
          const resultsToInsert = resultEntries.map(([itemId, val]) => ({
              inspection_id: inspectionId,
              item_id: itemId,
              status: val.status,
              observation: val.observation,
              photo: val.photo,
              generated_order_id: generatedOrdersMap[itemId] || null
          }));

          const { error: resultsError } = await supabase
              .from('inspection_results')
              .insert(resultsToInsert);

          if (resultsError) throw resultsError;

          // Success feedback
          if (issues.length > 0) {
              alert(`Vistoria concluída! Foram geradas ${issues.length} ordens de serviço.`);
          } else {
              alert('Vistoria concluída com sucesso! Tudo em ordem.');
          }

          navigate('/checklists');

      } catch (error: any) {
          console.error(error);
          alert('Erro ao salvar vistoria: ' + error.message);
      } finally {
          setSubmitting(false);
      }
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-marinho" size={32} />
              <span className="text-slate-500">Preparando checklist...</span>
          </div>
      </div>
  );

  return (
    <div className="pb-24 relative">
      
      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-sm px-4 lg:px-6 py-4 border-b border-slate-200 shadow-sm sticky -top-4 lg:-top-6 -mx-4 lg:-mx-6 mb-4 z-30 transition-all">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
              <button onClick={() => navigate('/checklists')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors">
                  <ArrowLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-marinho uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Área {currentAreaIndex + 1}/{areas.length}
                      </span>
                      <h2 className="text-lg font-bold text-slate-800 truncate leading-tight">
                          {currentArea}
                      </h2>
                  </div>
              </div>
              <div className="text-right whitespace-nowrap">
                  <span className="text-xl font-bold text-marinho">{progress}%</span>
              </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
              <div 
                  className="h-full bg-mata transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
              />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="max-w-2xl mx-auto space-y-4 px-1">
          {items.filter(i => i.area === currentArea).map(item => { // Filter here directly or use currentItems
              const result = results[item.id];
              const isOk = result?.status === 'ok';
              const isIssue = result?.status === 'issue';

              return (
                  <div key={item.id} className={`bg-white rounded-lg border-l-4 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      isOk ? 'border-l-green-500 border-slate-200' : 
                      isIssue ? 'border-l-red-500 border-red-100 bg-red-50/10' : 
                      'border-l-slate-300 border-slate-200'
                  }`}>
                      <div className="p-4">
                          <h3 className="font-semibold text-slate-800 mb-3">{item.description}</h3>
                          
                          <div className="flex gap-2 mb-3">
                              <button 
                                  onClick={() => handleResult(item.id, 'ok')}
                                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95 ${
                                      isOk 
                                      ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1 shadow-sm' 
                                      : 'bg-slate-50 text-slate-600 hover:bg-green-50 hover:text-green-600 border border-slate-200'
                                  }`}
                              >
                                  <Check size={18} />
                                  <span>Conforme</span>
                              </button>

                              <button 
                                  onClick={() => handleResult(item.id, 'issue')}
                                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95 ${
                                      isIssue
                                      ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1 shadow-sm'
                                      : 'bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200'
                                  }`}
                              >
                                  <X size={18} />
                                  <span>Problema</span>
                              </button>
                          </div>

                          {/* Issue Details Panel */}
                          {isIssue && (
                              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 animate-in slide-in-from-top-2 space-y-3">
                                  <div>
                                    <label className="text-xs font-bold text-red-600 uppercase mb-1 block">O que aconteceu?</label>
                                    <textarea 
                                        className="w-full p-2 border border-red-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-300 min-h-[60px]"
                                        placeholder="Descreva o problema..."
                                        rows={2}
                                        value={results[item.id]?.observation || ''}
                                        onChange={(e) => handleObservation(item.id, e.target.value)}
                                    />
                                  </div>

                                  <div>
                                      <input 
                                          type="file" 
                                          accept="image/*"
                                          className="hidden"
                                          ref={(el) => { if (el) fileInputRefs.current[item.id] = el; }}
                                          onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handlePhotoUpload(item.id, file);
                                          }}
                                      />
                                      
                                      {result?.photo ? (
                                          <div className="relative w-fit group">
                                              <img src={result.photo} alt="Evidência" className="h-24 w-24 object-cover rounded-lg border border-red-200 shadow-sm" />
                                              <button 
                                                onClick={() => setResults(prev => ({...prev, [item.id]: {...prev[item.id], photo: undefined}}))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                              >
                                                  <X size={14} />
                                              </button>
                                          </div>
                                      ) : (
                                          <button 
                                            onClick={() => fileInputRefs.current[item.id]?.click()}
                                            disabled={uploading === item.id}
                                            className="text-sm w-full flex items-center justify-center gap-2 text-red-600 bg-white border border-red-200 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors shadow-sm font-medium"
                                          >
                                              {uploading === item.id ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />} 
                                              {uploading === item.id ? 'Enviando...' : 'Adicionar Foto / Evidência'}
                                          </button>
                                      )}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
          <div className="max-w-2xl mx-auto flex gap-4">
              {currentAreaIndex > 0 && (
                  <button 
                    onClick={() => {
                        setCurrentAreaIndex(prev => prev - 1);
                        window.scrollTo(0,0);
                    }}
                    className="px-4 py-3 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                      Voltar
                  </button>
              )}
              
              <button 
                  onClick={nextArea}
                  disabled={currentItems.some(i => !results[i.id]) || submitting} 
                  className="flex-1 bg-marinho text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-marinho/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-[0.98]"
              >
                  {currentAreaIndex === areas.length - 1 ? (
                      submitting ? <><Loader2 className="animate-spin" /> Finalizando...</> : 'Concluir Vistoria'
                  ) : (
                      <>Próxima Área <ChevronRight size={20} /></>
                  )}
              </button>
          </div>
      </div>
    </div>
  );
}

