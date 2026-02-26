import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { ChecklistTemplate } from '../../types/checklist';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function ChecklistList() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('active', true);
        
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevent card click
      navigate(`/checklists/edit/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if (window.confirm(`Tem certeza que deseja excluir o modelo "${name}"? Ele será arquivado e não aparecerá mais nesta lista.`)) {
          try {
              const { error } = await supabase
                  .from('checklist_templates')
                  .update({ active: false })
                  .eq('id', id);
              
              if (error) throw error;
              
              setTemplates(templates.filter(t => t.id !== id));
          } catch (error) {
              console.error('Error deleting:', error);
              alert('Erro ao excluir template.');
          }
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando modelos...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vistorias & Checklists</h1>
          <p className="text-slate-500">Selecione um local para iniciar a inspeção</p>
        </div>
        
        {/* Only Admin/Leader can create templates */}
        {(user?.role === 'admin' || user?.role === 'leader') && (
            <button 
                onClick={() => navigate('/checklists/create')}
                className="bg-marinho text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-marinho/90 shadow-sm"
            >
                <Plus size={18} /> Novo Modelo
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div 
            key={template.id}
            onClick={() => navigate(`/checklists/new?template=${template.id}`)}
            className="bg-white p-6 rounded-xl border border-slate-200 hover:border-marinho hover:shadow-md transition-all cursor-pointer group relative flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-marinho group-hover:bg-marinho group-hover:text-white transition-colors">
                <ClipboardCheck size={24} />
              </div>
              
              {(user?.role === 'admin' || user?.role === 'leader') ? (
                  <div className="flex gap-1">
                      <button 
                        onClick={(e) => handleEdit(e, template.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar Modelo"
                      >
                          <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, template.id, template.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir Modelo"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
              ) : (
                <ArrowRight className="text-slate-300 group-hover:text-marinho transition-colors" />
              )}
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 mb-1">{template.name}</h3>
            
            <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
              <MapPin size={14} />
              <span>{template.location}</span>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center text-marinho font-medium text-sm group-hover:underline">
              Iniciar Vistoria <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        ))}
      </div>
      
      {templates.length === 0 && !loading && (
          <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
             <p className="text-slate-500">Nenhum modelo de vistoria ativo encontrado.</p>
          </div>
      )}
    </div>
  );
}
