import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.approved === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Conta em Análise</h2>
          <p className="text-slate-600 text-sm mb-6">
            Seu cadastro foi realizado com sucesso, mas o acesso ainda não foi liberado.
            Por favor, aguarde a aprovação de um administrador para utilizar o sistema.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition-colors text-sm"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
