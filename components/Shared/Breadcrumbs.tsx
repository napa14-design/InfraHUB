
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, LayoutGrid } from 'lucide-react';

const routeLabels: Record<string, string> = {
  'module': '', // Ignored in render
  'hydrosys': 'HydroSys',
  'pestcontrol': 'Controle de Pragas',
  'cloro': 'Cloro & pH',
  'certificados': 'Certificados',
  'filtros': 'Filtros',
  'reservatorios': 'Reservatórios',
  'config': 'Configurações',
  'analytics': 'Analytics',
  'execution': 'Ordens de Serviço',
  'help': 'Ajuda',
  'admin': 'Administração',
  'users': 'Usuários',
  'org': 'Estrutura',
  'notifications': 'Notificações',
  'logs': 'Auditoria'
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 animate-in fade-in slide-in-from-left-2 duration-500">
      <Link 
        to="/" 
        className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        title="Voltar ao Hub"
      >
        <LayoutGrid size={12} />
        <span className="hidden sm:inline">Hub</span>
      </Link>
      
      {pathnames.map((value, index) => {
        // Skip technical segments like 'module' if desired, or map them
        if (value === 'module') return null;

        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[value] || value;

        return (
          <React.Fragment key={to}>
            <ChevronRight size={10} className="mx-2 text-slate-300 dark:text-slate-700" />
            {isLast ? (
              <span className="text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {label}
              </span>
            ) : (
              <Link 
                to={to} 
                className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline decoration-1 underline-offset-2 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
