import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ChecklistTemplate } from '../../types/checklist';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, MapPin, Plus } from 'lucide-react';
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
      // Fallback for demo/development if table doesn't exist yet
      setTemplates([
          { id: 'mock-1', name: 'Vistoria Padrão - Tesoura', location: 'Tesoura', active: true },
          { id: 'mock-2', name: 'Vistoria Padrão - Bangalô', location: 'Bangalô', active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startInspection = async (templateId: string) => {
    try {
        setLoading(true);
        // Create new inspection
        const { data, error } = await supabase
            .from('inspections')
            .insert({
                template_id: templateId,
                user_id: user?.id,
                status: 'in_progress'
            })
            .select()
            .single();

        if (error) throw error;
        
        navigate(`/checklists/${data.id}`);
    } catch (error) {
        console.error('Error starting inspection:', error);
        // Mock navigation for dev
        navigate(`/checklists/new?template=${templateId}`);
    } finally {
        setLoading(false);
    }
  };

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
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => startInspection(template.id)}
            disabled={loading}
            className="flex flex-col items-start text-left bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-marinho/50 hover:shadow-md transition-all group disabled:opacity-50"
          >
            <div className="p-3 bg-blue-50 rounded-lg text-marinho mb-4 group-hover:bg-marinho group-hover:text-white transition-colors">
              <ClipboardCheck size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">{template.name}</h3>
            
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
              <MapPin size={14} />
              <span>{template.location}</span>
            </div>

            <div className="w-full mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-marinho font-medium text-sm">
              <span>Iniciar Vistoria</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
      
      {templates.length === 0 && !loading && (
          <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <p className="text-slate-500">Nenhum modelo de checklist encontrado.</p>
          </div>
      )}
    </div>
  );
}
