
import React, { useState } from 'react';
import { LayoutGrid, Lock, User, ShieldCheck, Zap, ArrowRight, CheckCircle2, AlertCircle, X, Key } from 'lucide-react';
import { authService } from '../services/authService';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (email: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);
      
      if (result.error) {
         setError(result.error);
         setIsLoading(false);
         return;
      }

      if (result.user) {
         await onLogin(result.user.email);
      }

    } catch (err) {
      setError('Erro ao conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      await authService.resetPasswordRequest(email);
      setIsLoading(false);
      alert('Se o e-mail existir, um link de redefinição foi enviado.');
      setShowForgot(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-white transition-colors">
      {/* Lado Esquerdo - Visual */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-center items-center overflow-hidden bg-[#0a1e45]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#112d69] via-[#0f2455] to-[#051029] z-0"></div>
        <div className="absolute inset-0 opacity-20">
             <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full"></div>
             <div className="absolute top-40 right-40 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
        </div>

        <div className="relative z-10 mb-12 flex items-center justify-center">
            <div className="absolute w-[400px] h-[400px] border border-blue-400/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute w-[300px] h-[300px] border border-blue-400/20 rounded-full"></div>
            <div className="w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_20px_rgba(96,165,250,0.8)] animate-ping"></div>
        </div>

        <div className="relative z-10 text-center px-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Portal de Infraestrutura</h1>
            <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                O ecossistema digital para o setor de operações e gestão.
            </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 lg:p-16 relative">
        <div className="max-w-md w-full">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Acesso Centralizado</h2>
                <p className="text-slate-500 dark:text-slate-400">Conecte-se ao ecossistema Nexus Hub.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">E-mail Corporativo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                      placeholder="nome@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Senha</label>
                      <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-brand-600 hover:text-brand-700 font-bold">Esqueceu a senha?</button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/20 text-sm font-bold text-white bg-[#0f2455] hover:bg-[#1a3a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                      <>Acessar Sistema <ArrowRight size={16} className="ml-2" /></>
                  )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                 <p className="text-xs text-slate-400">
                     Certifique-se de que sua conta foi criada no Supabase Authentication.
                 </p>
            </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Recuperar Senha</h3>
                      <button onClick={() => setShowForgot(false)}><X className="text-slate-400" /></button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Digite seu e-mail para receber um link de redefinição.</p>
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <input 
                          type="email" 
                          required
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                      />
                      <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl">Enviar Link</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
