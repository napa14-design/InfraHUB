
import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, X, Key, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLogin: (email: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      alert('Se o e-mail existir, um link de redefinição foi enviado.');
      setShowForgot(false);
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#0C0C0E]">
      
      {/* ========== ARCHITECTURAL BACKGROUND ========== */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0C0C0E] via-[#111114] to-[#0C0C0E]" />
        
        {/* Blueprint Grid - Main */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(#3B82F6 1px, transparent 1px),
              linear-gradient(90deg, #3B82F6 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Blueprint Grid - Fine */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(#3B82F6 0.5px, transparent 0.5px),
              linear-gradient(90deg, #3B82F6 0.5px, transparent 0.5px)
            `,
            backgroundSize: '12px 12px',
          }}
        />

        {/* Architectural Lines - Diagonal Structure */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="diag-lines" patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="100" stroke="#3B82F6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag-lines)" />
        </svg>

        {/* Isometric Building Shapes - Left Side */}
        <div className="absolute left-0 bottom-0 w-[60%] h-full overflow-hidden opacity-[0.06]">
          <svg viewBox="0 0 800 900" className="absolute bottom-0 left-0 h-full" preserveAspectRatio="xMinYMax slice">
            {/* Building 1 - Tall */}
            <g stroke="#F97316" strokeWidth="1" fill="none">
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
            <g stroke="#3B82F6" strokeWidth="1" fill="none">
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
            <g stroke="#F97316" strokeWidth="1" fill="none" opacity="0.7">
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
            <line x1="0" y1="898" x2="800" y2="898" stroke="#3B82F6" strokeWidth="2" />
          </svg>
        </div>

        {/* Technical Measurements - Top */}
        <div className="absolute top-8 left-8 right-8 flex justify-between opacity-[0.15]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-blue-500">
            <div className="w-2 h-2 border border-blue-500" />
            <span>GRID: 60x60</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px w-20 bg-blue-500" />
            <span className="text-[10px] font-mono text-blue-500">SCALE 1:100</span>
            <div className="h-px w-20 bg-blue-500" />
          </div>
          <div className="text-[10px] font-mono text-blue-500">
            REV. 2.0
          </div>
        </div>

        {/* Corner Brackets */}
        <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-orange-500/20" />
        <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-orange-500/20" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-orange-500/20" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-orange-500/20" />

        {/* Accent glow */}
        <div 
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)',
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
            <div className="w-12 h-12 border-2 border-orange-500 flex items-center justify-center bg-orange-500/10">
              <LayoutGrid size={24} className="text-orange-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-mono">
              INFRA<span className="text-orange-500">HUB</span>
            </h2>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em]">
              Enterprise Platform
            </p>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8 max-w-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-transparent" />
              <span className="text-[10px] font-mono text-orange-500/70 uppercase tracking-widest">
                Sistema Operacional
              </span>
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight">
              Controle
              <br />
              <span className="text-orange-500">Centralizado.</span>
            </h1>
          </div>
          
          <p className="text-lg text-white/40 leading-relaxed">
            Plataforma unificada para gestão de infraestrutura, 
            monitoramento de recursos e operações em tempo real.
          </p>

          {/* Technical specs */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: '24/7', label: 'Operação' },
              { value: '99.9%', label: 'Uptime' },
              { value: 'AES-256', label: 'Encryption' },
            ].map((item, i) => (
              <div key={i} className="border-l-2 border-white/10 pl-4">
                <div className="text-2xl font-bold text-white font-mono">{item.value}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider font-mono">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - Technical Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-white/20">
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
            <div className="absolute -inset-px bg-gradient-to-b from-white/10 via-white/5 to-white/10 rounded-sm" />
            <div className="absolute top-0 left-4 right-4 h-px bg-orange-500/50" />
            
            <div className="relative bg-[#111114] p-8 lg:p-10">
              
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-10 h-10 border-2 border-orange-500 flex items-center justify-center bg-orange-500/10">
                  <LayoutGrid size={20} className="text-orange-500" />
                </div>
                <span className="text-lg font-bold text-white font-mono">
                  INFRA<span className="text-orange-500">HUB</span>
                </span>
              </div>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-orange-500" />
                  <span className="text-[10px] font-mono text-orange-500/70 uppercase tracking-widest">
                    Autenticação
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Acesso ao Sistema
                </h1>
                <p className="text-sm text-white/40 mt-1">
                  Insira suas credenciais para continuar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-mono text-white/50 uppercase tracking-wider">
                    <span className="text-orange-500">01.</span> E-mail
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
                        w-full px-4 py-4 bg-white/[0.02] border text-white placeholder-white/20 outline-none transition-all font-mono
                        ${focusedField === 'email' ? 'border-orange-500 bg-orange-500/5' : 'border-white/10 hover:border-white/20'}
                      `}
                      placeholder="usuario@empresa.com"
                    />
                    {focusedField === 'email' && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500" />
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-[10px] font-mono text-white/50 uppercase tracking-wider">
                      <span className="text-orange-500">02.</span> Senha
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowForgot(true)}
                      className="text-[10px] font-mono text-orange-500/70 hover:text-orange-500 transition-colors uppercase tracking-wider"
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
                        w-full px-4 py-4 pr-12 bg-white/[0.02] border text-white placeholder-white/20 outline-none transition-all font-mono
                        ${focusedField === 'password' ? 'border-orange-500 bg-orange-500/5' : 'border-white/10 hover:border-white/20'}
                      `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {focusedField === 'password' && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500" />
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400">
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
                  <div className="relative flex items-center justify-center gap-3 w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2 text-white/30">
                    <span className={`w-2 h-2 ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span>{isSupabaseConfigured() ? 'SISTEMA ONLINE' : 'MODO OFFLINE'}</span>
                  </div>
                  <Link to="/setup" className="text-white/30 hover:text-orange-500 transition-colors uppercase tracking-wider">
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
            <div className="absolute top-0 left-4 right-4 h-px bg-orange-500/50" />
            
            <div className="relative bg-[#111114] p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 border-2 border-orange-500/30 flex items-center justify-center bg-orange-500/5">
                  <Key size={22} className="text-orange-500" />
                </div>
                <button 
                  onClick={() => setShowForgot(false)}
                  className="text-white/40 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-500" />
                <span className="text-[10px] font-mono text-orange-500/70 uppercase tracking-widest">
                  Recuperação
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Recuperar Acesso</h3>
              <p className="text-white/40 text-sm mb-6 font-mono">
                Informe seu e-mail cadastrado.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 bg-white/[0.02] border border-white/10 text-white placeholder-white/20 outline-none focus:border-orange-500 transition-all font-mono"
                  placeholder="usuario@empresa.com"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-orange-500 text-white font-bold hover:bg-orange-400 transition-all disabled:opacity-50 font-mono uppercase tracking-wider text-sm"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Link'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
