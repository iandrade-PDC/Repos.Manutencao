import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
    Droplets, Flame, Trash2, Bug, Save, 
    CalendarCheck, CheckCircle2, ChevronDown, ChevronUp, History
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
    
    interface TaskState {
        status: boolean;
        user_name?: string;
    }
    const [tasks, setTasks] = useState<Record<string, TaskState>>({
        trash: { status: false },
        fumace: { status: false },
        pool_clean: { status: false },
        pool_vacuum: { status: false },
        pool_chlorine: { status: false }
    });

    const [observation, setObservation] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [readingHistory, setReadingHistory] = useState<Array<{date: string, location: string, value: number, type: string}>>([]);
    const [taskHistory, setTaskHistory] = useState<Array<{date: string, label: string, user_name: string}>>([]);

    useEffect(() => {
        fetchMeters();
        loadTodayData();
    }, []);

    const fetchHistory = async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const since = sevenDaysAgo.toISOString().split('T')[0];

        // Fetch Readings
        const { data: readings } = await supabase
            .from('daily_readings')
            .select('date, location, value, type')
            .gte('date', since)
            .order('date', { ascending: false })
            .order('location', { ascending: true });

        if (readings) setReadingHistory(readings);

        // Fetch Tasks
        const { data: tasks } = await supabase
            .from('daily_tasks_log')
            .select('*')
            .gte('date', since)
            .eq('status', true);

        if (tasks && tasks.length > 0) {
            const userIds = Array.from(new Set(tasks.map(t => t.user_id).filter(Boolean)));
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);
            
            const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p.full_name]));
            
            const taskLabelMap: Record<string, string> = {
                trash: 'Retirar Lixo',
                fumace: 'Aplicar Fumacê',
                insecticide: 'Aplicar Fumacê',
                pool_clean: 'Piscina: Peneira',
                pool_vacuum: 'Piscina: Aspirar',
                pool_chlorine: 'Piscina: Cloro'
            };

            const mappedTasks = tasks
                .filter(t => t.task_slug !== 'general_obs') // Skip observations for now
                .map(t => ({
                    date: t.date,
                    label: taskLabelMap[t.task_slug] || t.task_slug,
                    user_name: profileMap[t.user_id] || ''
                }));
            
            setTaskHistory(mappedTasks);
        } else {
            setTaskHistory([]);
        }
    };

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

            if (tasksData && tasksData.length > 0) {
                // Fetch profiles for users who completed tasks
                const userIds = Array.from(new Set(tasksData.map(t => t.user_id).filter(Boolean)));
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);
                
                const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p.full_name]));

                const newTasks = { ...tasks };
                tasksData.forEach(t => {
                    const userName = profileMap[t.user_id] || '';
                    if (t.task_slug === 'insecticide') newTasks.fumace = { status: t.status, user_name: userName }; // Legacy mapping
                    if (t.task_slug === 'fumace') newTasks.fumace = { status: t.status, user_name: userName }; 
                    if (t.task_slug === 'trash') newTasks.trash = { status: t.status, user_name: userName };
                    if (t.task_slug === 'pool_clean') newTasks.pool_clean = { status: t.status, user_name: userName };
                    if (t.task_slug === 'pool_vacuum') newTasks.pool_vacuum = { status: t.status, user_name: userName };
                    if (t.task_slug === 'pool_chlorine') newTasks.pool_chlorine = { status: t.status, user_name: userName };
                    
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

    const handleTaskToggle = async (slug: string, checked: boolean) => {
        if (!user) return;
        
        // Optimistic UI update
        setTasks(prev => ({ 
            ...prev, 
            [slug]: { status: checked, user_name: checked ? user.name : undefined } 
        }));
        
        const today = new Date().toISOString().split('T')[0];
        try {
            // Check if exists first to avoid conflict errors
            const { data: existing } = await supabase
                .from('daily_tasks_log')
                .select('id')
                .eq('date', today)
                .eq('task_slug', slug)
                .maybeSingle();

            let opError;
            if (existing) {
                const { error } = await supabase
                    .from('daily_tasks_log')
                    .update({ status: checked, user_id: user.id })
                    .eq('id', existing.id);
                opError = error;
            } else {
                const { error } = await supabase
                    .from('daily_tasks_log')
                    .insert({ date: today, task_slug: slug, status: checked, user_id: user.id });
                opError = error;
            }

            if (opError) throw opError;
            
            // Show brief success indicator
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Error saving task:', error);
            // Revert on error
            setTasks(prev => ({ 
                ...prev, 
                [slug]: { status: !checked, user_name: !checked ? user.name : undefined } 
            }));
            alert('Não foi possível salvar a tarefa: ' + (error as Error).message);
        }
    };

    const handleSaveReadings = async (type: 'water' | 'gas') => {
        if (!user) return;
        setLoading(true);
        setSaved(false);
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const typeMeters = type === 'water' ? waterMeters : gasMeters;
            const readingsToInsert: any[] = [];
            
            typeMeters.forEach(meter => {
                const value = meterReadings[meter.name];
                if (value) {
                    readingsToInsert.push({
                        date: today,
                        type: type,
                        location: meter.name,
                        value: Number(value),
                        unit: type === 'gas' ? 'Kg/m³' : 'm³',
                        user_id: user.id
                    });
                }
            });

            if (readingsToInsert.length > 0) {
                 // Delete old readings of this type for today to avoid duplicates (team overwrite)
                 await supabase.from('daily_readings')
                     .delete()
                     .eq('date', today)
                     .eq('type', type);
                     
                 const { error: readError } = await supabase.from('daily_readings').insert(readingsToInsert);
                 if (readError) throw readError;
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            if (showHistory) fetchHistory();
        } catch (error) {
            console.error(`Error saving ${type} routine:`, error);
            alert(`Erro ao salvar leituras de ${type === 'water' ? 'água' : 'gás'}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveObservation = async () => {
        if (!user || !observation) return;
        setLoading(true);
        setSaved(false);
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const { error } = await supabase
                .from('daily_tasks_log')
                .upsert({
                    date: today,
                    task_slug: 'general_obs',
                    status: true,
                    user_id: user.id,
                    observation: observation
                }, { onConflict: 'date,task_slug' });

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving observation:', error);
            alert('Erro ao salvar observação.');
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
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <button 
                            onClick={() => handleSaveReadings('water')}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Save size={18} /> Salvar Água
                        </button>
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

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <button 
                                onClick={() => handleSaveReadings('gas')}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Save size={18} /> Salvar Gás
                            </button>
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
                            <div className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all ${tasks.trash.status ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                                <label className="flex items-center gap-3 w-full cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500 border-slate-300"
                                        checked={tasks.trash.status}
                                        onChange={e => handleTaskToggle('trash', e.target.checked)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Trash2 size={18} className={tasks.trash.status ? 'text-green-600' : 'text-slate-400'} />
                                        <span className={`text-sm font-medium ${tasks.trash.status ? 'text-green-900' : 'text-slate-600'}`}>Retirar o Lixo</span>
                                    </div>
                                </label>
                                {tasks.trash.status && tasks.trash.user_name && (
                                    <div className="text-[10px] text-green-700 mt-1.5 ml-8 font-medium">Marcado por: {tasks.trash.user_name}</div>
                                )}
                            </div>

                            {/* Fumacê */}
                            <div className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all ${tasks.fumace.status ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                                <label className="flex items-center gap-3 w-full cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded text-green-600 focus:ring-green-500 border-slate-300"
                                        checked={tasks.fumace.status}
                                        onChange={e => handleTaskToggle('fumace', e.target.checked)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Bug size={18} className={tasks.fumace.status ? 'text-green-600' : 'text-slate-400'} />
                                        <span className={`text-sm font-medium ${tasks.fumace.status ? 'text-green-900' : 'text-slate-600'}`}>Aplicar Fumacê</span>
                                    </div>
                                </label>
                                {tasks.fumace.status && tasks.fumace.user_name && (
                                    <div className="text-[10px] text-green-700 mt-1.5 ml-8 font-medium">Marcado por: {tasks.fumace.user_name}</div>
                                )}
                            </div>

                             {/* Piscina */}
                             <div className="pt-2 mt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-tight px-3 mb-2 block">Piscina</label>
                                {[
                                    { key: 'pool_clean', label: 'Limpeza de Borda / Peneira' },
                                    { key: 'pool_vacuum', label: 'Aspirar Fundo' },
                                    { key: 'pool_chlorine', label: 'Aplicação de Cloro' }
                                ].map((item) => (
                                    <div key={item.key} className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all ${tasks[item.key].status ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <label className="flex items-center gap-3 w-full cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                                checked={tasks[item.key].status}
                                                onChange={(e) => handleTaskToggle(item.key, e.target.checked)}
                                            />
                                            <span className={`text-sm font-medium ${tasks[item.key].status ? 'text-blue-900' : 'text-slate-600'}`}>{item.label}</span>
                                        </label>
                                        {tasks[item.key].status && tasks[item.key].user_name && (
                                            <div className="text-[10px] text-blue-700 mt-1.5 ml-8 font-medium">Marcado por: {tasks[item.key].user_name}</div>
                                        )}
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Observation */}
            <div className="px-4 md:px-0">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Observações Gerais</label>
                    <textarea 
                        className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 min-h-[100px] mb-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-marinho/20 transition-all"
                        placeholder="Alguma observação sobre o dia?"
                        value={observation}
                        onChange={e => setObservation(e.target.value)}
                    />
                    <button 
                        onClick={handleSaveObservation}
                        disabled={loading || !observation}
                        className="w-full flex items-center justify-center gap-2 bg-marinho hover:bg-marinho/90 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Save size={18} /> Salvar Observação
                    </button>
                </div>
            </div>
            
            {/* HISTÓRICO GERAL */}
            <div className="px-4 md:px-0">
                <button
                    onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <History size={18} className="text-slate-400" />
                        Histórico Geral (7 dias)
                    </div>
                    {showHistory ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {showHistory && (
                    <div className="mt-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {readingHistory.length === 0 && taskHistory.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Nenhum registro encontrado nos últimos 7 dias.</p>
                        ) : (
                            (() => {
                                // Group by date
                                const byDate: Record<string, { readings: typeof readingHistory, tasks: typeof taskHistory }> = {};
                                
                                readingHistory.forEach(r => {
                                    if (!byDate[r.date]) byDate[r.date] = { readings: [], tasks: [] };
                                    byDate[r.date].readings.push(r);
                                });
                                
                                taskHistory.forEach(t => {
                                    if (!byDate[t.date]) byDate[t.date] = { readings: [], tasks: [] };
                                    byDate[t.date].tasks.push(t);
                                });

                                // Sort dates descending
                                const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

                                return sortedDates.map(date => {
                                    const { readings, tasks } = byDate[date];
                                    return (
                                        <div key={date} className="border-b border-slate-50 last:border-0">
                                            <div className="px-4 py-2 bg-slate-50 flex items-center gap-2 border-b border-slate-100">
                                                <CalendarCheck size={13} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500">
                                                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            {/* Tarefas Section */}
                                            {tasks.length > 0 && (
                                                <div className="px-4 py-3 border-b border-slate-50 last:border-0">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tarefas Concluídas</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {tasks.map((t, i) => (
                                                            <div key={`t-${i}`} className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs">
                                                                <CheckCircle2 size={12} className="text-green-500" />
                                                                <span className="font-semibold">{t.label}</span>
                                                                {t.user_name && <span className="text-green-600/70 opacity-80 text-[10px]">({t.user_name.split(' ')[0]})</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Leituras Section */}
                                            {readings.length > 0 && (
                                                <div className="px-4 py-3">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Leituras Registradas</div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {readings.map((r, i) => (
                                                            <div key={`r-${i}`} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-2 py-1.5 shadow-sm">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    {r.type === 'gas'
                                                                        ? <Flame size={12} className="text-orange-500 shrink-0" />
                                                                        : <Droplets size={12} className="text-blue-500 shrink-0" />
                                                                    }
                                                                    <span className="text-[11px] text-slate-600 truncate">{r.location}</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-slate-800 ml-2 shrink-0">
                                                                    {r.value} {r.type === 'gas' ? 'kg' : 'm³'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
