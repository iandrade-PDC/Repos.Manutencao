import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, CheckSquare, BarChart3, Menu, LogOut, Bell, MessageSquare, User, X, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { NotificationDropdown } from '../components/common/NotificationDropdown';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { user, logout, canManageUsers } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Visão Geral" },
    { to: "/new-order", icon: PlusCircle, label: "Nova Solicitação" },
    { to: "/orders", icon: List, label: "Lista de Ordens" },
    { to: "/resolve", icon: CheckSquare, label: "Resolver Chamados" },
    { to: "/ranking", icon: BarChart3, label: "Rankings & Relatórios" },
    { to: "/profile", icon: User, label: "Meu Perfil" },
  ];

  if (canManageUsers()) {
     // Insert before Profile or at the end
     navItems.splice(5, 0, { to: "/users", icon: Users, label: "Gerenciar Usuários" }); 
  }

  return (
    <div className="h-screen bg-areia flex flex-col overflow-hidden relative">
      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-marinho p-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <MessageSquare size={18} />
                Suporte Técnico
              </h3>
              <button onClick={() => setIsHelpOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Contato</p>
                  <p className="text-sm font-semibold text-slate-800">Ivan Andrade</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                    <MessageSquare size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Email</p>
                    <a href="mailto:iandrade@pontadocurral.com" className="text-sm font-medium text-marinho hover:underline">
                      iandrade@pontadocurral.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                    <Bell size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Telefone / WhatsApp</p>
                    <a href="tel:+5575988584205" className="text-sm font-medium text-marinho hover:underline">
                      +55 75 98858-4205
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="w-full py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header - Enterprise Style */}
      <header className="h-14 bg-marinho text-areia flex items-center justify-between px-4 shadow-md z-50 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="lg:hidden text-areia/80 hover:text-white">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white p-[1px] rounded-full w-8 h-8 flex items-center justify-center overflow-hidden">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-areia hidden sm:block">Ancoradouro da Ponta</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Removed */}
          
          <div className="h-6 w-px bg-white/20 mx-2 hidden md:block" />

          <NotificationDropdown />
          
          <div className="flex items-center gap-3 pl-4 border-l border-white/20">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold leading-tight text-white">{user?.name || 'Usuário'}</p>
              <p className="text-[10px] text-areia/70 uppercase tracking-wider">{user?.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-areia/80 hover:text-white"
              title="Sair do sistema"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 pt-14 lg:pt-0 flex flex-col",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex-1 py-4 overflow-y-auto">
            <div className="px-4 mb-2">
              <p className="text-xs font-semibold text-mata uppercase tracking-wider pl-2">Menu Principal</p>
            </div>
            <nav className="space-y-0.5 px-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border-l-4",
                      isActive 
                        ? "bg-areia text-mata border-mata font-bold" 
                        : "text-slate-600 hover:bg-areia/50 hover:text-mata border-transparent"
                    )
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="w-full flex items-center gap-3 hover:bg-slate-100 p-2 rounded-lg transition-colors text-left group"
            >
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700 group-hover:bg-blue-200 transition-colors">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">Precisa de Ajuda?</p>
                <p className="text-[10px] text-slate-500">Contate o suporte técnico</p>
              </div>
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 lg:p-6 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
