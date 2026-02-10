
import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface FirstLoginSetupProps {
    user: User;
    onComplete: () => void;
}

export const FirstLoginSetup: React.FC<FirstLoginSetupProps> = ({ user, onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    const result = await authService.completeFirstLogin(user.id, password);
    setLoading(false);

    if (result.success) {
        setSuccess(true);
        setTimeout(() => {
            onComplete();
        }, 1500);
    } else {
        setError(result.error || 'Erro ao definir senha.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      
      <div className="w-full max-w-md relative animate-in zoom-in-95 duration-300">
          {/* Card */}
          <div className="relative bg-white dark:bg-[#111114] p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl">
              
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 dark:bg-orange-500/10 border border-brand-100 dark:border-orange-500/20 mb-4 animate-pulse">
                    <ShieldCheck size={32} className="text-brand-600 dark:text-orange-500" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Bem-vindo, {user.name.split(' ')[0]}</h1>
                <p className="text-sm text-slate-500 dark:text-white/40 mt-2">
                    Este é seu primeiro acesso. Por segurança, defina sua nova senha pessoal para continuar.
                </p>
              </div>

              {success ? (
                  <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4 animate-in zoom-in">
                          <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tudo Pronto!</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Liberando acesso...</p>
                  </div>
              ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 dark:text-white/50 uppercase tracking-wider">Nova Senha Pessoal</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl outline-none focus:border-brand-500 dark:focus:border-orange-500 transition-all font-mono"
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
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl outline-none focus:border-brand-500 dark:focus:border-orange-500 transition-all font-mono"
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
                      className="w-full py-4 bg-brand-600 hover:bg-brand-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 uppercase tracking-wider font-mono text-sm shadow-lg shadow-brand-500/20"
                    >
                      {loading ? 'Salvando...' : 'Definir Senha e Entrar'}
                    </button>
                  </form>
              )}
          </div>
      </div>
    </div>
  );
};
