
import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, X, Key, Eye, EyeOff, LayoutGrid, Sun, Moon, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useTheme } from './ThemeContext';

interface LoginProps {
  onLogin: (email: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setError('Erro crítico ao conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      await authService.resetPasswordRequest(email);
      setIsLoading(false);
      setIsResetSent(true); // Show success view instead of closing
  };

  const closeForgotModal = () => {
      setShowForgot(false);
      setIsResetSent(false); // Reset state for next time
      setEmail('');
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-slate-50 dark:bg-[#0C0C0E] text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Theme Toggle Button - Floating Top Right */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/20 transition-all shadow-lg"
        title="Alternar Tema"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {/* ========== ARCHITECTURAL BACKGROUND ========== */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0C0C0E] dark:via-[#111114] dark:to-[#0C0C0E]" />
        
        {/* Blueprint Grid - Main */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] text-brand-600 dark:text-brand-500"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 1px, transparent 1px),
              linear-gradient(90deg, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Blueprint Grid - Fine */}
        <div 
          className="absolute inset-0 opacity-[0.02] text-slate-900 dark:text-white"
          style={{
            backgroundImage: `
              linear-gradient(currentColor 0.5px, transparent 0.5px),
              linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)
            `,
            backgroundSize: '12px 12px',
          }}
        />

        {/* Architectural Lines - Diagonal Structure */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] dark:opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="diag-lines" patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="100" className="stroke-slate-900 dark:stroke-brand-500" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag-lines)" />
        </svg>

        {/* Isometric Building Shapes - Left Side */}
        <div className="absolute left-0 bottom-0 w-[60%] h-full overflow-hidden opacity-10 dark:opacity-[0.06]">
          <svg viewBox="0 0 800 900" className="absolute bottom-0 left-0 h-full" preserveAspectRatio="xMinYMax slice">
            {/* Building 1 - Tall */}
            <g className="stroke-brand-600 dark:stroke-orange-500" strokeWidth="1" fill="none">
              <path d="M100,900 L100,400 L200,350 L200,900" />
              <path d="M200,350 L300,400 L300,900" />
              <path d="M100,400 L200,350 L300,400" />
              {/* Windows */}
              {[...Array(10)].map((_, i) => (
                <rect key={i} x="120" y={420 + i * 45} width="25" height="30" />
              ))}
              {[...Array(10)].map((_, i) => (
                <rect key={i} x="160" y={420 + i * 45} width="25" height="30" />
              ))}
              {[...Array(10)].map((_, i) => (
                <rect key={i} x="230" y={440 + i * 45} width="25" height="30" />
              ))}
            </g>
            
            {/* Building 2 - Medium */}
            <g className="stroke-slate-400 dark:stroke-brand-500" strokeWidth="1" fill="none">
              <path d="M320,900 L320,550 L420,500 L420,900" />
              <path d="M420,500 L520,550 L520,900" />
              <path d="M320,550 L420,500 L520,550" />
              {[...Array(7)].map((_, i) => (
                <rect key={i} x="340" y={570 + i * 45} width="30" height="30" />
              ))}
              {[...Array(7)].map((_, i) => (
                <rect key={i} x="450" y={590 + i * 45} width="30" height="30" />
              ))}
            </g>

            {/* Building 3 - Wide */}
            <g className="stroke-brand-600 dark:stroke-orange-500" strokeWidth="1" fill="none" opacity="0.7">
              <path d="M500,900 L500,650 L650,600 L650,900" />
              <path d="M650,600 L800,650 L800,900" />
              <path d="M500,650 L650,600 L800,650" />
              {[...Array(5)].map((_, i) => (
                <rect key={i} x="520" y={680 + i * 42} width="40" height="28" />
              ))}
              {[...Array(5)].map((_, i) => (
                <rect key={i} x="580" y={680 + i * 42} width="40" height="28" />
              ))}
              {[...Array(5)].map((_, i) => (
                <rect key={i} x="680" y={700 + i * 42} width="40" height="28" />
              ))}
              {[...Array(5)].map((_, i) => (
                <rect key={i} x="740" y={700 + i * 42} width="40" height="28" />
              ))}
            </g>

            {/* Ground line */}
            <line x1="0" y1="898" x2="800" y2="898" className="stroke-slate-900 dark:stroke-brand-500" strokeWidth="2" />
          </svg>
        </div>

        {/* Technical Measurements - Top */}
        <div className="absolute top-8 left-8 right-20 flex justify-between opacity-30 dark:opacity-[0.15]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-700 dark:text-blue-500">
            <div className="w-2 h-2 border border-current" />
            <span>GRID: 60x60</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="h-px w-20 bg-brand-700 dark:bg-blue-500" />
            <span className="text-[10px] font-mono text-brand-700 dark:text-blue-500">ESCALA 1:100</span>
            <div className="h-px w-20 bg-brand-700 dark:bg-blue-500" />
          </div>
          <div className="text-[10px] font-mono text-brand-700 dark:text-blue-500">
            REV. 2.0
          </div>
        </div>

        {/* Corner Brackets */}
        <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-brand-500/20 dark:border-orange-500/20" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-brand-500/20 dark:border-orange-500/20" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-brand-500/20 dark:border-orange-500/20" />

        {/* Accent glow */}
        <div 
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* ========== LEFT PANEL - BRANDING ========== */}
      <div 
        className={`
          hidden lg:flex flex-col justify-between flex-1 p-12 xl:p-16 relative z-10
          transition-all duration-1000
          ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-brand-500 dark:border-orange-500 flex items-center justify-center bg-brand-500/10 dark:bg-orange-500/10">
              <LayoutGrid size={24} className="text-brand-600 dark:text-orange-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">
              INFRA<span className="text-brand-600 dark:text-orange-500">HUB</span>
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-white/30 font-mono uppercase tracking-[0.2em]">
              Plataforma Corporativa
            </p>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8 max-w-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-brand-500/50 dark:from-orange-500/50 to-transparent" />
              <span className="text-[10px] font-mono text-brand-600 dark:text-orange-500/70 uppercase tracking-widest">
                Sistema Operacional
              </span>
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
              Controle
              <br />
              <span className="text-brand-600 dark:text-orange-500">Centralizado.</span>
            </h1>
          </div>
          
          <p className="text-lg text-slate-600 dark:text-white/40 leading-relaxed">
            Plataforma unificada para gestão de infraestrutura, 
            monitoramento de recursos e operações em tempo real.
          </p>

          {/* Technical specs */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: '24/7', label: 'Operação' },
              { value: '99.9%', label: 'Disponibilidade' },
              { value: 'AES-256', label: 'Criptografia' },
            ].map((item, i) => (
              <div key={i} className="border-l-2 border-slate-200 dark:border-white/10 pl-4">
                <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">{item.value}</div>
                <div className="text-[10px] text-slate-500 dark:text-white/30 uppercase tracking-wider font-mono">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - Technical Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-white/20">
          <span>LAT -3.7319 | LONG -38.5267</span>
          <span>© {new Date().getFullYear()} GRUPO CHRISTUS</span>
          <span>v2.0.0</span>
        </div>
      </div>

      {/* ========== RIGHT PANEL - LOGIN FORM ========== */}
      <div 
        className={`
          w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 flex items-center justify-center p-6 lg:p-12 relative z-10
          transition-all duration-1000 delay-200
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        {/* Form Container */}
        <div className="w-full max-w-sm">
          
          {/* Card */}
          <div className="relative">
            {/* Border frame */}
            <div className="absolute -inset-px bg-white/50 dark:bg-white/5 rounded-sm shadow-xl dark:shadow-none" />
            <div className="absolute top-0 left-4 right-4 h-px bg-brand-500/50 dark:bg-orange-500/50" />
            
            <div className="relative bg-white dark:bg-[#111114] p-8 lg:p-10 border border-slate-200 dark:border-white/5 shadow-2xl dark:shadow-none">
              
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-10 h-10 border-2 border-brand-500 dark:border-orange-500 flex items-center justify-center bg-brand-500/10 dark:bg-orange-500/10">
                  <LayoutGrid size={20} className="text-brand-600 dark:text-orange-500" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  INFRA<span className="text-brand-600 dark:text-orange-500">HUB</span>
                </span>
              </div>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-brand-600 dark:bg-orange-500" />
                  <span className="text-[10px] font-mono text-brand-600/70 dark:text-orange-500/70 uppercase tracking-widest">
                    Autenticação
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Acesso ao Sistema
                </h1>
                <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
                  Insira suas credenciais para continuar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-white/50 uppercase tracking-wider">
                    <span className="text-brand-600 dark:text-orange-500">01.</span> E-mail
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={`
                        w-full px-4 py-4 border outline-none transition-all font-mono
                        ${focusedField === 'email' 
                            ? 'border-brand-500 dark:border-orange-500 bg-brand-50 dark:bg-orange-500/5 text-slate-900 dark:text-white' 
                            : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-white/20'
                        }
                      `}
                      placeholder="usuario@empresa.com"
                    />
                    {focusedField === 'email' && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-brand-500 dark:bg-orange-500" />
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-white/50 uppercase tracking-wider">
                      <span className="text-brand-600 dark:text-orange-500">02.</span> Senha
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowForgot(true)}
                      className="text-[10px] font-mono text-brand-600/70 dark:text-orange-500/70 hover:text-brand-600 dark:hover:text-orange-500 transition-colors uppercase tracking-wider"
                    >
                      Recuperar
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className={`
                        w-full px-4 py-4 pr-12 border outline-none transition-all font-mono
                        ${focusedField === 'password' 
                            ? 'border-brand-500 dark:border-orange-500 bg-brand-50 dark:bg-orange-500/5 text-slate-900 dark:text-white' 
                            : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-white/20'
                        }
                      `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {focusedField === 'password' && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-brand-500 dark:bg-orange-500" />
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span className="text-sm font-mono">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full mt-4"
                >
                  <div className="relative flex items-center justify-center gap-3 w-full py-4 bg-brand-600 hover:bg-brand-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="font-mono uppercase tracking-wider text-sm">Acessar</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                  {/* Button corner accent */}
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/30" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/30" />
                </button>
              </form>

              {/* Status Footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-white/30">
                    <span className={`w-2 h-2 ${isSupabaseConfigured() ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span>{isSupabaseConfigured() ? 'SISTEMA ONLINE' : 'MODO OFFLINE'}</span>
                  </div>
                  <Link to="/setup" className="text-slate-400 dark:text-white/30 hover:text-brand-600 dark:hover:text-orange-500 transition-colors uppercase tracking-wider">
                    Setup
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========== FORGOT PASSWORD MODAL ========== */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            {/* Border frame */}
            <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-white/5" />
            <div className="absolute top-0 left-4 right-4 h-px bg-brand-500/50 dark:bg-orange-500/50" />
            
            <div className="relative bg-white dark:bg-[#111114] p-8 border border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 border-2 border-brand-500/30 dark:border-orange-500/30 flex items-center justify-center bg-brand-50 dark:bg-orange-500/5">
                  <Key size={22} className="text-brand-600 dark:text-orange-500" />
                </div>
                <button 
                  onClick={closeForgotModal}
                  className="text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {isResetSent ? (
                  /* SUCCESS STATE */
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">E-mail Enviado!</h3>
                          <p className="text-slate-500 dark:text-white/40 text-sm mb-6 font-mono leading-relaxed">
                              Verifique sua caixa de entrada (e spam). Enviamos um link para redefinir sua senha.
                          </p>
                          <button
                            onClick={closeForgotModal}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold transition-all font-mono uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                          >
                            <ArrowLeft size={16} /> Voltar para Login
                          </button>
                      </div>
                  </div>
              ) : (
                  /* FORM STATE */
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-brand-600 dark:bg-orange-500" />
                        <span className="text-[10px] font-mono text-brand-600/70 dark:text-orange-500/70 uppercase tracking-widest">
                          Recuperação
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Recuperar Acesso</h3>
                      <p className="text-slate-500 dark:text-white/40 text-sm mb-6 font-mono">
                        Informe seu e-mail cadastrado.
                      </p>

                      <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 outline-none focus:border-brand-500 dark:focus:border-orange-500 transition-all font-mono"
                            placeholder="usuario@empresa.com"
                            />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-4 bg-brand-600 hover:bg-brand-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white font-bold transition-all disabled:opacity-50 font-mono uppercase tracking-wider text-sm"
                        >
                          {isLoading ? 'Enviando...' : 'Enviar Link'}
                        </button>
                      </form>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};