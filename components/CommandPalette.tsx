
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Command, ArrowRight, LayoutGrid, Droplets, 
  Settings, Users, FileText, LogOut, Moon, Sun, 
  TestTube, Shield, Activity, Bug
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { authService } from '../services/authService';
import { UserRole } from '../types';

interface CommandItem {
  id: string;
  label: string;
  subLabel?: string;
  icon: React.ElementType;
  action: () => void;
  keywords: string[];
  minRole?: UserRole;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const user = authService.getCurrentUser();

  // Define Commands
  const commands: CommandItem[] = [
    // Navigation
    { 
      id: 'nav-home', 
      label: 'Dashboard Principal', 
      icon: LayoutGrid, 
      action: () => navigate('/'), 
      keywords: ['home', 'inicio', 'painel'] 
    },
    { 
      id: 'nav-hydro', 
      label: 'Módulo HydroSys', 
      subLabel: 'Gestão de água', 
      icon: Droplets, 
      action: () => navigate('/module/hydrosys'), 
      keywords: ['agua', 'hydro', 'modulo'] 
    },
    { 
      id: 'nav-pest', 
      label: 'Controle de Pragas', 
      subLabel: 'Dedetização & Vetores', 
      icon: Bug, 
      action: () => navigate('/module/pestcontrol'), 
      keywords: ['pragas', 'dedetizacao', 'barata', 'rato', 'modulo'] 
    },
    { 
      id: 'nav-cloro', 
      label: 'Lançar Cloro/pH', 
      subLabel: 'HydroSys > Diário', 
      icon: TestTube, 
      action: () => navigate('/module/hydrosys/cloro'), 
      keywords: ['medicao', 'analise', 'quimico'] 
    },
    
    // Admin Actions
    { 
      id: 'adm-users', 
      label: 'Gerenciar usuários', 
      icon: Users, 
      action: () => navigate('/admin/users'), 
      keywords: ['admin', 'pessoas', 'acesso'],
      minRole: UserRole.GESTOR 
    },
    { 
      id: 'adm-logs', 
      label: 'Logs de Auditoria', 
      icon: Shield, 
      action: () => navigate('/admin/logs'), 
      keywords: ['seguranca', 'historico', 'audit'],
      minRole: UserRole.GESTOR
    },
    { 
      id: 'adm-config', 
      label: 'Configurações Globais', 
      icon: Settings, 
      action: () => navigate('/admin/notifications'), 
      keywords: ['regras', 'alertas', 'setup'],
      minRole: UserRole.ADMIN
    },

    // System Actions
    { 
      id: 'sys-theme', 
      label: 'Alternar Tema', 
      subLabel: 'Claro / Escuro',
      icon: Moon, 
      action: () => toggleTheme(), 
      keywords: ['escuro', 'claro', 'modo', 'dark'] 
    },
    { 
      id: 'sys-logout', 
      label: 'Sair do Sistema', 
      icon: LogOut, 
      action: () => { authService.logout(); navigate('/login'); }, 
      keywords: ['logout', 'sair', 'fechar'] 
    }
  ];

  // Filter commands based on user role and query
  const filteredCommands = commands.filter(cmd => {
    // Role check
    if (cmd.minRole && user) {
       if (!authService.hasPermission(user.role, cmd.minRole)) return false;
    }
    
    // Text search
    const search = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(search) ||
      (cmd.subLabel && cmd.subLabel.toLowerCase().includes(search)) ||
      cmd.keywords.some(k => k.includes(search))
    );
  });

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle List Navigation inside modal
  useEffect(() => {
    if (!isOpen) {
        setQuery('');
        setSelectedIndex(0);
        return;
    }
    
    // Focus input on open
    setTimeout(() => inputRef.current?.focus(), 50);

    const handleListNav = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                setIsOpen(false);
            }
        }
    };

    window.addEventListener('keydown', handleListNav);
    return () => window.removeEventListener('keydown', handleListNav);
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      
      {/* Modal */}
      <div className="w-full max-w-xl bg-white dark:bg-[#111114] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <Search className="text-slate-400 w-5 h-5 mr-3" />
            <input 
                ref={inputRef}
                className="flex-1 bg-transparent outline-none text-slate-800 dark:text-white font-mono text-sm placeholder-slate-400"
                placeholder="O que você procura?"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            />
            <div className="hidden sm:flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-mono">ESC</span>
            </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-mono">Nenhum comando encontrado.</p>
                </div>
            ) : (
                filteredCommands.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = index === selectedIndex;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => { item.action(); setIsOpen(false); }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all group text-left
                                ${isActive 
                                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' 
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            <div className={`p-2 rounded-md mr-4 transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                            </div>
                            <div className="flex-1">
                                <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                    {item.label}
                                </div>
                                {item.subLabel && (
                                    <div className={`text-xs ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                        {item.subLabel}
                                    </div>
                                )}
                            </div>
                            {isActive && <ArrowRight size={16} className="text-white animate-in slide-in-from-left-2" />}
                        </button>
                    );
                })
            )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <div className="flex gap-4">
                <span><strong className="text-slate-500 dark:text-slate-300">??</strong> Navegar</span>
                <span><strong className="text-slate-500 dark:text-slate-300">?</strong> Selecionar</span>
            </div>
            <div className="flex items-center gap-1">
                <Command size={10} /> <span>Command Center</span>
            </div>
        </div>
      </div>
    </div>
  );
};
