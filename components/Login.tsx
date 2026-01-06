import React, { useState } from 'react';
import { LayoutGrid, Lock, User, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MOCK_USERS } from '../constants';

interface LoginProps {
  onLogin: (email: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await onLogin(email);
      if (!success) {
        setError('Usuário não encontrado. Tente um dos e-mails de demonstração.');
      }
    } catch (err) {
      setError('Erro ao conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = MOCK_USERS.map(u => ({
    email: u.email,
    role: u.role,
    name: u.name
  }));

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden">
      {/* Lado Esquerdo - Visual (60% width on Desktop) */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-center items-center overflow-hidden bg-[#0a1e45]">
        {/* Background Gradient & Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#112d69] via-[#0f2455] to-[#051029] z-0"></div>
        
        {/* Particles/Stars (Static CSS approximation) */}
        <div className="absolute inset-0 opacity-20">
             <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full"></div>
             <div className="absolute top-40 right-40 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
             <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-white rounded-full"></div>
        </div>

        {/* Radar Effect */}
        <div className="relative z-10 mb-12 flex items-center justify-center">
            <div className="absolute w-[400px] h-[400px] border border-blue-400/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute w-[300px] h-[300px] border border-blue-400/20 rounded-full"></div>
            <div className="absolute w-[200px] h-[200px] border border-blue-400/30 rounded-full"></div>
            <div className="w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_20px_rgba(96,165,250,0.8)] animate-ping"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full"></div>
            
            {/* Orbiting dot */}
            <div className="absolute w-[200px] h-[200px] animate-[spin_4s_linear_infinite]">
                 <div className="w-3 h-3 bg-blue-300 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(147,197,253,1)]"></div>
            </div>
        </div>

        {/* Text Content */}
        <div className="relative z-10 text-center px-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Portal de Infraestrutura</h1>
            <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                O ecossistema digital para o setor de operações e gestão. Centralize, monitore e gerencie com eficiência.
            </p>

            <div className="flex justify-center gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Conectado
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-300"/> Seguro
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2">
                    <Zap size={14} className="text-amber-300"/> Ágil
                </div>
            </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 lg:p-16 bg-white relative">
        <div className="max-w-md w-full">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Acesso Centralizado</h2>
                <p className="text-slate-500">Conecte-se ao ecossistema Nexus Hub.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail Corporativo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all outline-none bg-slate-50 focus:bg-white"
                      placeholder="nome@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                    </div>
                    <input
                      type="password"
                      disabled
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <ShieldCheck size={16} /> {error}
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

            <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Acesso Seguro</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Autenticação de dois fatores e criptografia de ponta para proteger seus dados.</p>
                    </div>
                </div>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Zap className="text-emerald-600" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Performance</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Acesso rápido e estável a todas as ferramentas internas.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-center text-slate-400 mb-3">Login de Demonstração (Simulado)</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {demoAccounts.map(acc => (
                        <button 
                            key={acc.email} 
                            onClick={() => setEmail(acc.email)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-colors"
                        >
                            {acc.role}
                        </button>
                    ))}
                </div>
            </div>

             <div className="mt-auto pt-8 text-center">
                 <p className="text-xs text-slate-400">© 2026 Nexus Corp. Todos os direitos reservados.</p>
             </div>
        </div>
      </div>
    </div>
  );
};