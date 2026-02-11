import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save, Trash2, Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChecklistBuilder() {
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState('');
  const [location, setLocation] = useState('');
  const [items, setItems] = useState<{area: string, description: string}[]>([
      { area: 'Geral', description: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
      // Auto-fill area with previous item's area for convenience
      const lastArea = items.length > 0 ? items[items.length - 1].area : 'Geral';
      setItems([...items, { area: lastArea, description: '' }]);
  };

  const removeItem = (index: number) => {
      setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'area' | 'description', value: string) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      setItems(newItems);
  };

  const handleSave = async () => {
    if (!templateName || !location) {
        alert('Por favor, preencha o nome do modelo e a localização.');
        return;
    }

    if (items.some(i => !i.description)) {
        alert('Preencha a descrição de todos os itens.');
        return;
    }

    setLoading(true);
    try {
        // 1. Create Template
        const { data: template, error: tmplError } = await supabase
            .from('checklist_templates')
            .insert({
                name: templateName,
                location: location,
                active: true
            })
            .select()
            .single();

        if (tmplError) throw tmplError;

        // 2. Create Items
        const itemsToInsert = items.map((item, index) => ({
            template_id: template.id,
            area: item.area,
            description: item.description,
            item_order: index + 1
        }));

        const { error: itemsError } = await supabase
            .from('checklist_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        alert('Modelo de vistoria criado com sucesso!');
        navigate('/checklists');

    } catch (error: any) {
        console.error('Error saving template:', error);
        alert('Erro ao salvar modelo: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/checklists')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
             <ArrowLeft size={20} />
        </button>
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Criar Novo Modelo</h1>
           <p className="text-slate-500">Configure um novo roteiro de vistoria</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-marinho border-b pb-2">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Modelo</label>
                  <input 
                      type="text" 
                      placeholder="Ex: Vistoria Diária - Piscina"
                      className="w-full p-2 border border-slate-300 rounded-md"
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Localização Padrão</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-2.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Ex: Área Externa / Bangalô"
                        className="w-full pl-10 p-2 border border-slate-300 rounded-md"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                    />
                  </div>
              </div>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-lg text-marinho">Itens de Verificação</h2>
            <button 
                onClick={addItem}
                className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium"
            >
                <Plus size={16} /> Adicionar Item
            </button>
          </div>

          <div className="space-y-3">
              {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start animate-in slide-in-from-left-2">
                       <div className="w-8 pt-2 text-center text-slate-400 text-xs font-bold">
                           #{index + 1}
                       </div>
                       <div className="w-1/3">
                           <input 
                                type="text"
                                placeholder="Área (ex: Sala)"
                                className="w-full p-2 text-sm border border-slate-300 rounded-md focus:border-marinho focus:ring-1 focus:ring-marinho"
                                value={item.area}
                                onChange={e => updateItem(index, 'area', e.target.value)}
                           />
                       </div>
                       <div className="flex-1">
                           <input 
                                type="text"
                                placeholder="O que verificar? (ex: Lâmpadas)"
                                className="w-full p-2 text-sm border border-slate-300 rounded-md focus:border-marinho focus:ring-1 focus:ring-marinho"
                                value={item.description}
                                onChange={e => updateItem(index, 'description', e.target.value)}
                           />
                       </div>
                       <button 
                          onClick={() => removeItem(index)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remover item"
                        >
                           <Trash2 size={18} />
                       </button>
                  </div>
              ))}
          </div>
          
          {items.length === 0 && (
              <div className="text-center py-8 text-slate-500 italic">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
              </div>
          )}
      </div>

      <div className="flex justify-end pt-4">
          <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-mata text-white py-3 px-8 rounded-lg font-bold shadow-lg hover:bg-mata/90 flex items-center gap-2 disabled:opacity-50"
          >
              <Save size={20} />
              {loading ? 'Salvando...' : 'Salvar Modelo'}
          </button>
      </div>

    </div>
  );
}
