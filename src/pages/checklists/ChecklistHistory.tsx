import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Search, Calendar } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ChecklistPdfDocument } from '../../components/ChecklistPdfDocument';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ChecklistHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
     fetchHistory();
  }, []);

  const fetchHistory = async () => {
      try {
          const { data, error } = await supabase
              .from('inspections')
              .select(`
                 id, 
                 completed_at,
                 checklist_templates(name, location),
                 inspection_results(
                     status,
                     observation,
                     checklist_items(description, area)
                 )
              `)
              .eq('status', 'completed')
              .order('completed_at', { ascending: false });
              
          if (error) throw error;
          setHistory(data || []);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const filteredHistory = history.filter(insp => {
      const search = searchTerm.toLowerCase();
      const matchName = insp.checklist_templates?.name?.toLowerCase().includes(search);
      const matchLoc = insp.checklist_templates?.location?.toLowerCase().includes(search);
      return matchName || matchLoc;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4">
          <button onClick={() => navigate('/checklists')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors">
              <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Histórico de Vistorias</h1>
            <p className="text-sm text-slate-500">Consulte relatórios e checklists antigos preenchidos no sistema</p>
          </div>
      </div>

      <div className="flex bg-white border border-slate-200 rounded-lg px-3 py-2 items-center gap-2 max-w-md shadow-sm">
         <Search size={18} className="text-slate-400" />
         <input 
             type="text" 
             placeholder="Buscar por local ou modelo..." 
             className="bg-transparent border-none outline-none flex-1 text-sm text-slate-700"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      {loading ? (
          <div className="text-center p-12 text-slate-500">
              <span className="animate-pulse">Carregando acervo de vistoria...</span>
          </div>
      ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
               <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                     <th className="px-6 py-4">Data / Hora</th>
                     <th className="px-6 py-4">Modelo / Local</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Relatório PDF</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(insp => {
                      const errors = insp.inspection_results?.filter((r:any) => r.status === 'issue')?.length || 0;
                      return (
                          <tr key={insp.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                     <Calendar size={14} className="text-slate-400" />
                                     {new Date(insp.completed_at).toLocaleDateString('pt-BR')} às {new Date(insp.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <p className="font-bold text-slate-700">{insp.checklist_templates?.name || 'N/A'}</p>
                                  <p className="text-xs text-slate-500">{insp.checklist_templates?.location}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                  {errors > 0 
                                     ? <span className="text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-md text-xs whitespace-nowrap border border-red-100">{errors} Problemas</span> 
                                     : <span className="text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded-md text-xs whitespace-nowrap border border-green-100">100% Conforme</span>}
                              </td>
                              <td className="px-6 py-4 text-right pl-0">
                                  <div className="flex justify-end">
                                      <PDFDownloadLink
                                          document={
                                              <ChecklistPdfDocument 
                                                  inspection={insp} 
                                                  template={insp.checklist_templates} 
                                                  results={insp.inspection_results || []} 
                                                  userProfile={{ name: user?.name || 'Técnico' }}
                                              />
                                          }
                                          fileName={`Vistoria_${insp.checklist_templates?.name || 'Local'}_${new Date(insp.completed_at).toLocaleDateString('pt-BR').replace(/\//g,'-')}.pdf`}
                                          className="inline-flex items-center gap-2 text-white font-medium bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                                      >
                                          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                          {/* @ts-ignore */}
                                          {({ loading }) => loading ? 'Gerando Doc...' : <><Download size={16} /> Relatório</>}
                                      </PDFDownloadLink>
                                  </div>
                              </td>
                          </tr>
                      );
                  })}
               </tbody>
            </table>
            {filteredHistory.length === 0 && (
                 <div className="text-center p-12 text-slate-500 bg-slate-50/50">Nenhum resultado encontrado para a busca.</div>
            )}
         </div>
      )}
    </div>
  );
}
