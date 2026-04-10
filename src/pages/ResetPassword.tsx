import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

type Mode = 'detecting' | 'request' | 'update';

export function ResetPassword() {
  const navigate = useNavigate();
  // Start as 'detecting' while Supabase processes the URL token
  const [mode, setMode] = useState<Mode>('detecting');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Fallback: check URL hash immediately (fires before Supabase event)
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || (hash.includes('access_token') && hash.includes('recovery'))) {
      setMode('update');
      return;
    }

    // Primary: listen for the PASSWORD_RECOVERY event from Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update');
      } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
        setMode(prev => prev === 'detecting' ? 'request' : prev);
      }
    });

    // Safety timeout: if no event in 800ms, show the request form
    const timer = setTimeout(() => {
      setMode(prev => prev === 'detecting' ? 'request' : prev);
    }, 800);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage({
        type: 'success',
        text: 'Email enviado! Verifique sua caixa de entrada e clique no link para redefinir a senha.',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao enviar email.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Redirecionando...' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar senha.' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Util ─────────────────────────────────────────────
  const Feedback = () => message ? (
    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm border ${
      message.type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      {message.type === 'success'
        ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
        : <AlertCircle size={20} className="shrink-0 mt-0.5" />
      }
      <span>{message.text}</span>
    </div>
  ) : null;

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-areia flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* ── DETECTING ── */}
        {mode === 'detecting' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 border-4 border-marinho/20 border-t-marinho rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Verificando link de recuperação...</p>
          </div>
        )}

        {/* ── REQUEST FORM ── */}
        {mode === 'request' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-marinho/10 mb-4">
                <KeyRound size={32} className="text-marinho" />
              </div>
              <h1 className="text-2xl font-bold text-marinho">Esqueci minha senha</h1>
              <p className="text-slate-500 mt-2 text-sm">
                Digite seu email e enviaremos um link de recuperação.
              </p>
            </div>

            <Feedback />

            <form onSubmit={handleRequestReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-marinho/40" size={20} />
                  <input
                    type="email"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-marinho/20 focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all bg-areia/30 text-marinho placeholder-marinho/30 text-sm"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || message?.type === 'success'}
                className="w-full py-3 rounded-xl bg-mata text-areia font-bold hover:bg-mata/90 shadow-lg shadow-mata/20 transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-areia/30 border-t-areia rounded-full animate-spin" />
                  : <Mail size={18} />
                }
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        )}

        {/* ── UPDATE PASSWORD FORM ── */}
        {mode === 'update' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mata/10 mb-4">
                <Lock size={32} className="text-mata" />
              </div>
              <h1 className="text-2xl font-bold text-marinho">Criar nova senha</h1>
              <p className="text-slate-500 mt-2 text-sm">Escolha uma nova senha para sua conta.</p>
            </div>

            <Feedback />

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-marinho/40" size={20} />
                  <input
                    type="password"
                    required
                    autoFocus
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-marinho/20 focus:outline-none focus:ring-2 focus:ring-marinho/20 focus:border-marinho transition-all bg-areia/30 text-marinho placeholder-marinho/30 text-sm"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Confirmar nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-marinho/40" size={20} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-areia/30 text-marinho placeholder-marinho/30 text-sm ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                        : 'border-marinho/20 focus:ring-marinho/20 focus:border-marinho'
                    }`}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 ml-1">As senhas não coincidem</p>
                )}
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[4, 6, 8, 12].map((threshold, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                          password.length >= threshold
                            ? i < 2 ? 'bg-red-400' : i === 2 ? 'bg-yellow-400' : 'bg-green-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    {password.length < 6 ? 'Muito curta' : password.length < 8 ? 'Fraca' : password.length < 12 ? 'Boa' : '✓ Forte'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || password !== confirmPassword || message?.type === 'success'}
                className="w-full py-3 rounded-xl bg-mata text-areia font-bold hover:bg-mata/90 shadow-lg shadow-mata/20 transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-areia/30 border-t-areia rounded-full animate-spin" />
                  : <Lock size={18} />
                }
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}

        {/* Back to login */}
        {mode !== 'detecting' && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-sm text-marinho/70 hover:text-marinho font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
