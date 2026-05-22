import { useState, useEffect } from 'react';
import { Users, Edit2, Shield, Mail, Search, Check, X, Ban } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'leader' | 'user';
  avatar_url?: string;
  sector?: string;
  approved?: boolean;
}

export function UserManagement() {
  const { canManageUsers, user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<'admin' | 'leader' | 'user'>('user');
  const [tempSector, setTempSector] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Sort: Pending users first
      const sortedUsers = (data || []).sort((a: any, b: any) => {
         if (a.approved === false && b.approved !== false) return -1;
         if (a.approved !== false && b.approved === false) return 1;
         return 0;
      });
      
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, newRole: 'admin' | 'leader' | 'user', newSector: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, sector: newSector })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, sector: newSector } : u));
      setEditingId(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, approved: true } : u));
    } catch (error: any) {
       console.error('Error approving user:', error);
       alert('Erro ao aprovar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleRevokeUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja bloquear o acesso deste usuário? Ele não conseguirá mais entrar no aplicativo.')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: false })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, approved: false } : u));
    } catch (error: any) {
       console.error('Error revoking user:', error);
       alert('Erro ao bloquear usuário: ' + (error.message || 'Erro desconhecido'));
    }
  };

  if (!canManageUsers()) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <Shield size={64} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    (user?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const startEditing = (user: Profile) => {
    setEditingId(user.id);
    setTempRole(user.role);
    setTempSector(user.sector || '');
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      leader: 'bg-blue-100 text-blue-700 border-blue-200',
      user: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const labels = {
      admin: 'Administrador',
      leader: 'Manutenção (Líder)',
      user: 'Usuário',
    };
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide whitespace-nowrap", styles[role as keyof typeof styles])}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marinho flex items-center gap-2">
            <Users size={28} />
            Gerenciar Usuários
          </h1>
          <p className="text-sm text-slate-500">Administre o acesso e permissões dos colaboradores.</p>
        </div>
        <div className="flex gap-2">
           {/* Photo upload removed for now as it requires specific storage logic per user */}
           {/* Add user usually handled via Invite/Auth, keeping it simple */}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-marinho bg-slate-50"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Setor</th>
                <th className="px-6 py-4">Status / Role</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                         {user.avatar_url ? (
                           <img src={user.avatar_url} alt={user.full_name || 'Usuário'} className="w-full h-full object-cover" />
                         ) : (
                           <span>{((user.full_name && user.full_name[0]) || (user.email && user.email[0]) || '?').toUpperCase()}</span>
                         )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.full_name || 'Sem nome'}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={10} />
                          {user.email || 'Email não cadastrado'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     {editingId === user.id ? (
                        <select 
                          className="text-xs p-1 rounded border border-slate-300 bg-white"
                          value={tempSector}
                          onChange={(e) => setTempSector(e.target.value)}
                        >
                           <option value="">Sem setor</option>
                           <option value="Manutenção">Manutenção</option>
                           <option value="Recepção">Recepção</option>
                           <option value="Governança">Governança</option>
                           <option value="Cozinha">Cozinha</option>
                           <option value="Restaurante">Restaurante</option>
                           <option value="Administração">Administração</option>
                           <option value="Jardinagem">Jardinagem</option>
                           <option value="Outro">Outro</option>
                        </select>
                     ) : (
                        <span className="text-slate-600 text-sm">{user.sector || '-'}</span>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs p-1 rounded border border-slate-300 bg-white"
                          value={tempRole}
                          onChange={(e) => setTempRole(e.target.value as any)}
                        >
                          <option value="user">Usuário</option>
                          <option value="leader">Líder (Manutenção)</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {getRoleBadge(user.role)}
                        {user.approved === false && (
                           <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                             Pendente
                           </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {/* Approval Button */}
                       {user.approved === false && (
                          <button 
                             onClick={() => handleApproveUser(user.id)}
                             className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors mr-2"
                             title="Aprovar Acesso"
                          >
                             <Check size={12} /> Aprovar
                          </button>
                       )}

                       {editingId === user.id ? (
                         <>
                           <button 
                             onClick={() => handleUpdateUser(user.id, tempRole, tempSector)}
                             className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" 
                             title="Confirmar"
                            >
                             <Check size={16} />
                           </button>
                           <button 
                             onClick={() => setEditingId(null)}
                             className="p-1.5 text-red-400 hover:bg-red-50 rounded-md transition-colors" 
                             title="Cancelar"
                            >
                             <X size={16} />
                           </button>
                         </>
                       ) : (
                        currentUser?.id !== user.id && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditing(user)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                              title="Alterar Permissão"
                            >
                              <Edit2 size={16} />
                            </button>
                            {user.approved !== false && (
                              <button 
                                onClick={() => handleRevokeUser(user.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                                title="Bloquear Acesso"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                          </div>
                        )
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
             <div className="p-8 text-center text-slate-400">Carregando usuários...</div>
          )}
          {!loading && filteredUsers.length === 0 && (
             <div className="p-8 text-center text-slate-400">Nenhum usuário encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
