
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

export const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if we actually have a session (user came from email link)
    const checkSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
            // No session? Probably accessed directly without email link
            setError('Sessão inválida ou expirada. Solicite uma nova recuperação de senha.');
        }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
    }

    if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    setLoading(true);
    const result = await authService.confirmPasswordReset(password);
    setLoading(false);

    if (result.success) {
        setSuccess(true);
        setTimeout(() => {
            navigate('/'); // Redirect to Dashboard or Login
        }, 2000);
    } else {
        setError(result.error || 'Erro ao atualizar senha.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#0C0C0E] text-slate-900 dark:text-white transition-colors duration-300 p-4">
      
      {/* Background Effects (Same as Login) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0C0C0E] dark:via-[#111114] dark:to-[#0C0C0E]" />
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] text-brand-600 dark:text-brand-500"
          style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
        />
      </div>

      <div className={`
          w-full max-w-md relative z-10 transition-all duration-1000
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
          {/* Card */}
          <div className="relative bg-white dark:bg-[#111114] p-8 lg:p-10 border border-slate-200 dark:border-white/5 shadow-2xl dark:shadow-none relative">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-500 dark:border-orange-500" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-500 dark:border-orange-500" />

              {/* Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 dark:bg-orange-500/10 border border-brand-100 dark:border-orange-500/20 mb-4">
                    <Key size={32} className="text-brand-600 dark:text-orange-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Definir Nova Senha</h1>
                <p className="text-sm text-slate-500 dark:text-white/40 mt-2">
                    Crie uma nova senha segura para sua conta.
                </p>
              </div>

              {success ? (
                  <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4 animate-in zoom-in">
                          <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Senha Atualizada!</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Redirecionando...</p>
                  </div>
              ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 dark:text-white/50 uppercase tracking-wider">Nova Senha</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-4 pr-12 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-500 dark:focus:border-orange-500 transition-all font-mono"
                          placeholder="mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 dark:text-white/50 uppercase tracking-wider">Confirmar Senha</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-500 dark:focus:border-orange-500 transition-all font-mono"
                        placeholder="Repita a senha"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertCircle size={18} className="flex-shrink-0" />
                        <span className="text-xs font-mono">{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-brand-600 hover:bg-brand-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white font-bold transition-all disabled:opacity-50 uppercase tracking-wider font-mono text-sm"
                    >
                      {loading ? 'Atualizando...' : 'Redefinir Senha'}
                    </button>
                  </form>
              )}
          </div>
          
          <div className="text-center mt-6">
               <button onClick={() => navigate('/login')} className="text-xs font-mono text-slate-400 hover:text-brand-600 dark:hover:text-orange-500 transition-colors uppercase tracking-widest">
                   Voltar para Login
               </button>
          </div>
      </div>
    </div>
  );
};
