
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Database } from 'lucide-react';

export const Instructions = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
    <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-800">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Database size={32} />
        <div className="absolute bg-white dark:bg-slate-900 rounded-full p-1 -bottom-2 -right-2 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 size={20} className="text-emerald-500" />
        </div>
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Setup de Banco de Dados</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
        Os scripts SQL foram removidos do código fonte para segurança e limpeza do projeto. 
        <br/><br/>
        Se você já executou os comandos no painel do Supabase, sua infraestrutura está pronta.
      </p>

      <div className="flex flex-col gap-3">
        <a 
           href="https://supabase.com/dashboard/project/_/editor" 
           target="_blank"
           rel="noopener noreferrer"
           className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
           Acessar Painel Supabase
        </a>
        <Link 
          to="/login"
          className="w-full flex items-center justify-center py-3 px-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar para Login
        </Link>
      </div>
    </div>
  </div>
);

// Mantendo exportações vazias para evitar quebra de importação caso algo ainda referencie, 
// mas o ideal é remover as referências.
export const SCHEMA_SQL = "";
export const SEED_SQL = "";
