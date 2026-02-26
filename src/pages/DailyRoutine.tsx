import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
    Droplets, Flame, Trash2, Bug, Save, 
    CalendarCheck, CheckCircle2 
} from 'lucide-react';

interface MeterPoint {
    id: string;
    name: string;
    type: 'water' | 'gas';
    display_order: number;
}

export function DailyRoutine() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showAllMeters, setShowAllMeters] = useState(false);
    
    // Configuration State
    const [meters, setMeters] = useState<MeterPoint[]>([]);

    // Form State - Dynamic for meters (Key: Meter Name, Value: Reading)
    const [meterReadings, setMeterReadings] = useState<Record<string, string>>({});
    
    // Tasks State
    const [tasks, setTasks] = useState({
        trash: false,
        fumace: false, // Renamed from insecticide
        pool_clean: false,
        pool_vacuum: false,
        pool_chlorine: false
    });

    const [observation, setObservation] = useState('');

    useEffect(() => {
        fetchMeters();
        loadTodayData();
    }, []);

    const fetchMeters = async () => {
        const { data } = await supabase
            .from('meter_points')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (data && data.length > 0) {
            setMeters(data);
        } else {
            // Fallback if table empty (or not run migration yet)
             setMeters([
                { id: '1', name: 'Geral', type: 'water' as const, display_order: 1 },
                { id: '2', name: 'Governança', type: 'water' as const, display_order: 2 },
                { id: '3', name: 'Praia', type: 'water' as const, display_order: 3 },
                { id: '4', name: 'Bomba', type: 'water' as const, display_order: 4 },
                { id: '5', name: 'Ancoradouro', type: 'water' as const, display_order: 5 },
                { id: '6', name: 'Estação', type: 'water' as const, display_order: 6 },
                { id: '7', name: 'Tesoura', type: 'water' as const, display_order: 7 },
                { id: '8', name: 'Maria Praça', type: 'water' as const, display_order: 8 },
                { id: '9', name: 'Maria Rio', type: 'water' as const, display_order: 9 },
                { id: '10', name: 'Igreja', type: 'water' as const, display_order: 10 },
                { id: '11', name: 'Coqueiro', type: 'water' as const, display_order: 11 },
                { id: '12', name: 'Cajueiro', type: 'water' as const, display_order: 12 },
                { id: '13', name: 'Cobogó', type: 'water' as const, display_order: 13 },
                { id: 'g1', name: 'Gás P13 - 01', type: 'gas' as const, display_order: 100 },
                { id: 'g2', name: 'Gás P13 - 02', type: 'gas' as const, display_order: 101 },
             ]);
        }
    };

    const loadTodayData = async () => {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            setLoading(true);
            
            // 1. Load Tasks
            const { data: tasksData } = await supabase
                .from('daily_tasks_log')
                .select('*')
                .eq('date', today);

            if (tasksData) {
                const newTasks = { ...tasks };
                tasksData.forEach(t => {
                    if (t.task_slug === 'insecticide') newTasks.fumace = t.status; // Legacy mapping
                    if (t.task_slug === 'fumace') newTasks.fumace = t.status; 
                    if (t.task_slug === 'trash') newTasks.trash = t.status;
                    if (t.task_slug === 'pool_clean') newTasks.pool_clean = t.status;
                    if (t.task_slug === 'pool_vacuum') newTasks.pool_vacuum = t.status;
                    if (t.task_slug === 'pool_chlorine') newTasks.pool_chlorine = t.status;
                    
                    if (t.task_slug === 'general_obs') setObservation(t.observation || '');
                });
                setTasks(newTasks);
            }

            // 2. Load Readings
            const { data: readingsData } = await supabase
                .from('daily_readings')
                .select('*')
                .eq('date', today);

            if (readingsData) {
                const newReadings: Record<string, string> = {};
                readingsData.forEach(r => {
                    // Match by name (location)
                    newReadings[r.location] = String(r.value);
                });
                setMeterReadings(newReadings);
            }

        } catch (error) {
            console.error('Error loading daily data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        try {
            // 1. Save Tasks
            const taskEntries = [
                { date: today, task_slug: 'trash', status: tasks.trash, user_id: user.id },
                { date: today, task_slug: 'fumace', status: tasks.fumace, user_id: user.id },
                { date: today, task_slug: 'pool_clean', status: tasks.pool_clean, user_id: user.id },
                { date: today, task_slug: 'pool_vacuum', status: tasks.pool_vacuum, user_id: user.id },
                { date: today, task_slug: 'pool_chlorine', status: tasks.pool_chlorine, user_id: user.id },
            ];
            
            if (observation) {
                taskEntries.push({
                    date: today,
                    task_slug: 'general_obs',
                    status: true,
                    user_id: user.id,
                    observation: observation
                } as any);
            }

            const { error: taskError } = await supabase
                .from('daily_tasks_log')
                .upsert(taskEntries, { onConflict: 'date,task_slug' });

            if (taskError) throw taskError;

            // 2. Save Readings
            const readingsToInsert: any[] = [];
            
            Object.entries(meterReadings).forEach(([name, value]) => {
                if (!value) return;
                
                // Find meter type
                const meter = meters.find(m => m.name === name);
                const type = meter ? meter.type : (name.includes('Gás') ? 'gas' : 'water');
                
                readingsToInsert.push({
                    date: today,
                    type: type,
                    location: name,
                    value: Number(value),
                    unit: type === 'gas' ? 'Kg/m³' : 'm³',
                    user_id: user.id
                });
            });

            if (readingsToInsert.length > 0) {
                 await supabase.from('daily_readings').delete().eq('date', today).eq('user_id', user.id);
                 const { error: readError } = await supabase.from('daily_readings').insert(readingsToInsert);
                 if (readError) throw readError;
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);

        } catch (error) {
            console.error('Error saving daily routine:', error);
            alert('Erro ao salvar rotina.');
        } finally {
            setLoading(false);
        }
    };

    // Group meters
    const waterMeters = meters.filter(m => m.type === 'water');
    const gasMeters = meters.filter(m => m.type === 'gas');

    return (
        <div className="max-w-md md:max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-0 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarCheck className="text-marinho" />
                        Rotina Diária
                    </h1>
                    <p className="text-slate-500 text-sm">Registro de {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                
                {saved && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm animate-in slide-in-from-right shadow-sm">
                        <CheckCircle2 size={18} />
                        Salvo!
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
                
                {/* BLOCO 1: Hidrômetros de Água */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-800 font-bold">
                            <Droplets size={20} className="text-blue-600" />
                            <h3>Água</h3>
                        </div>
                        <button 
                            onClick={() => setShowAllMeters(!showAllMeters)}
                            className="text-xs text-blue-600 font-semibold bg-white px-2 py-1 rounded border border-blue-200 shadow-sm active:scale-95 transition-all"
                        >
                            {showAllMeters ? 'Ver Menos' : `Ver Todos (${waterMeters.length})`}
                        </button>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-3">
                        {waterMeters.slice(0, showAllMeters ? 50 : 4).map(meter => (
                            <div key={meter.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                                <div className="flex-1 min-w-0">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1 truncate">
                                        {meter.name}
                                    </label>
                                    <input 
                                        type="number" 
                                        inputMode="numeric"
                                        placeholder="0000"
                                        className="w-full bg-transparent font-mono text-lg text-slate-800 font-bold focus:outline-none placeholder:text-slate-300"
                                        value={meterReadings[meter.name] || ''}
                                        onChange={e => setMeterReadings({...meterReadings, [meter.name]: e.target.value})}
                                    />
                                </div>
                                <div className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                                    m³
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* BLOCO 2: Gás */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex items-center gap-2 text-orange-800 font-bold">
                            <Flame size={20} className="text-orange-600" />
                            <h3>Gás</h3>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {gasMeters.map(meter => (
                                <div key={meter.id} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 truncate block">
                                        {meter.name}
                                    </label>
                                    <div className="flex items-baseline gap-1">
                                        <input 
                                            type="number" 
                                            inputMode="numeric"
                                            placeholder="00"
                                            className="w-full bg-transparent font-mono text-xl text-slate-800 font-bold focus:outline-none placeholder:text-slate-300"
                                            value={meterReadings[meter.name] || ''}
                                            onChange={e => setMeterReadings({...meterReadings, [meter.name]: e.target.value})}
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">kg</span>
                                    </div>
                                </div>
                            ))}
                            {gasMeters.length === 0 && <p className="col-span-2 text-sm text-slate-400 italic">Nenhum ponto de gás configurado.</p>}
                        </div>
                    </div>

                    {/* BLOCO 3: Tarefas */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                         <div className="bg-green-50/50 p-4 border-b border-green-100 flex items-center gap-2 text-green-800 font-bold">
                            <CheckCircle2 size={20} className="text-green-600" />
                            <h3>Tarefas</h3>
                        </div>
                        <div className="p-2 space-y-1">
                            {/* Lixo */}
                            <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${tasks.trash ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                                <input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500 border-slate-300"
                                    checked={tasks.trash}
                                    onChange={e => setTasks({...tasks, trash: e.target.checked})}
                                />
                                <div className="flex items-center gap-2">
                                    <Trash2 size={18} className={tasks.trash ? 'text-green-600' : 'text-slate-400'} />
                                    <span className={`text-sm font-medium ${tasks.trash ? 'text-green-900' : 'text-slate-600'}`}>Retirar o Lixo</span>
                                </div>
                            </label>

                            {/* Fumacê */}
                            <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${tasks.fumace ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                                <input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500 border-slate-300"
                                    checked={tasks.fumace}
                                    onChange={e => setTasks({...tasks, fumace: e.target.checked})}
                                />
                                <div className="flex items-center gap-2">
                                    <Bug size={18} className={tasks.fumace ? 'text-green-600' : 'text-slate-400'} />
                                    <span className={`text-sm font-medium ${tasks.fumace ? 'text-green-900' : 'text-slate-600'}`}>Aplicar Fumacê</span>
                                </div>
                            </label>

                             {/* Piscina */}
                             <div className="pt-2 mt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-tight px-3 mb-2 block">Piscina</label>
                                {[
                                    { key: 'pool_clean', label: 'Limpeza de Borda / Peneira' },
                                    { key: 'pool_vacuum', label: 'Aspirar Fundo' },
                                    { key: 'pool_chlorine', label: 'Aplicação de Cloro' }
                                ].map((item) => (
                                    <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${tasks[item.key as keyof typeof tasks] ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                            checked={tasks[item.key as keyof typeof tasks]}
                                            onChange={(e) => setTasks({...tasks, [item.key]: e.target.checked})}
                                        />
                                        <span className={`text-sm font-medium ${tasks[item.key as keyof typeof tasks] ? 'text-blue-900' : 'text-slate-600'}`}>{item.label}</span>
                                    </label>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Check & Save */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4 md:relative md:bg-transparent md:border-0 md:p-0 px-4">
                <div className="hidden md:block">
                     <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-white min-w-[300px]"
                        placeholder="Observações do dia..."
                        value={observation}
                        onChange={e => setObservation(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto bg-marinho text-white py-3.5 px-6 rounded-xl font-bold shadow-lg hover:bg-marinho/90 flex items-center justify-center gap-2 disabled:opacity-70 transition-transform active:scale-95 text-sm md:text-base"
                >
                    <Save size={20} />
                    {loading ? 'Salvando...' : 'Finalizar Rotina'}
                </button>
            </div>
            
            {/* Mobile Obs Input just above fixed footer */}
            <div className="md:hidden px-4 mb-4">
                <input 
                    type="text"
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-white shadow-sm"
                    placeholder="Adicionar observação..."
                    value={observation}
                    onChange={e => setObservation(e.target.value)}
                />
            </div>
        </div>
    );
}
