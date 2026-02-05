
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Camera, Save } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  
  // Mock state for profile editing (in a real app, this would update the backend)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '(11) 98765-4321',
    role: user?.role || 'user',
    department: 'Manutenção',
    location: 'Sede Administrativa'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    alert('Perfil atualizado com sucesso! (Simulação)');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
        <p className="text-sm text-slate-500">Gerencie suas informações pessoais e preferências.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                 {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                 ) : (
                    <User size={48} className="text-slate-300" />
                 )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
                <Camera size={16} />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800">{formData.name}</h2>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase mt-2">
              {formData.role}
            </span>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mt-6">
             <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Informações Rápidas</h3>
             <div className="space-y-3">
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <Mail size={16} className="text-slate-400" />
                 <span>{formData.email}</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <Phone size={16} className="text-slate-400" />
                 <span>{formData.phone}</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600">
                 <MapPin size={16} className="text-slate-400" />
                 <span>{formData.location}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Dados Pessoais</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Cargo</label>
                  <input 
                    type="text" 
                    value={formData.department}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled={true} // Email usually immutable
                    className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Telefone</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-marinho hover:bg-marinho/90 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                  >
                    <Save size={18} />
                    Salvar Alterações
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
