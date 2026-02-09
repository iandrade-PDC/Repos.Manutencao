import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, AlertCircle, Phone } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect when user state is active
  useEffect(() => {
    if (user) {
        navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      // Check for valid configuration before attempting login
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        throw new Error('CONFIGURAÇÃO PENDENTE: Configure as variáveis de ambiente (URL do Supabase) no painel da Vercel.');
      }

      if (isSignUp) {
        await signUp(email, password, name, sector, phone);
        // Auto login or show success message? Supabase usually logs in automatically after sign up unless validation is required.
        // But if confirm email is on, it won't. I disabled confirm email implicitly by not configuring it, 
        // default Supabase project requires confirm email.
        // I will assume for now it might require confirmation, so I'll show a message.
        // Actually for simplicity in this MVP, I hope email confirmation is off, but if not, user will see alert.
        setError('Conta criada! Verifique seu e-mail se necessário ou faça login.'); 
        setIsSignUp(false);
      } else {
        await login(email, password);
        // Do NOT navigate here. Let the useEffect handle it when state updates.
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-areia flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-marinho">Ancoradouro da Ponta</h1>
          <p className="text-marinho/60 mt-2">
            {isSignUp ? 'Crie sua conta' : 'Faça login para continuar'}
          </p>
          <div className="mt-4 text-xs text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded">
             v1.0.5 - Atualizado
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-marinho">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-marinho/40" size={20} />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-marinho/20 focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all bg-areia/30 text-marinho placeholder-marinho/30"
                  placeholder="Seu Nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
          )}

           {isSignUp && (
             <div className="space-y-2">
               <label className="text-sm font-medium text-marinho">Setor / Departamento</label>
               <div className="relative">
                 <select
                   required
                   className="w-full px-4 py-3 rounded-lg border border-marinho/20 focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all bg-white text-marinho appearance-none"
                   value={sector}
                   onChange={e => setSector(e.target.value)}
                 >
                   <option value="">Selecione seu departamento...</option>
                   <option value="Manutenção">Manutenção</option>
                   <option value="Recepção">Recepção</option>
                   <option value="Governança">Governança</option>
                   <option value="Cozinha">Cozinha</option>
                   <option value="Restaurante">Restaurante</option>
                   <option value="Administração">Administração</option>
                   <option value="Jardinagem">Jardinagem</option>
                   <option value="Outro">Outro</option>
                 </select>
               </div>
             </div>
           )}

           {isSignUp && (
             <div className="space-y-2">
               <label className="text-sm font-medium text-marinho">Telefone / WhatsApp</label>
               <div className="relative">
                 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-marinho/40" size={20} />
                 <input
                   type="tel"
                   required
                   className="w-full pl-10 pr-4 py-3 rounded-lg border border-marinho/20 focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all bg-areia/30 text-marinho placeholder-marinho/30"
                   placeholder="(00) 00000-0000"
                   value={phone}
                   onChange={e => setPhone(e.target.value)}
                 />
               </div>
             </div>
           )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-marinho">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-marinho/40" size={20} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-marinho/20 focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all bg-areia/30 text-marinho placeholder-marinho/30"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-marinho">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-marinho/40" size={20} />
              <input
                type="password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-marinho/20 focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all bg-areia/30 text-marinho placeholder-marinho/30"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-mata text-areia font-semibold hover:bg-mata/90 shadow-lg shadow-mata/20 transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-marinho font-semibold hover:underline"
          >
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
