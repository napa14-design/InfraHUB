
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Database, Copy, Terminal } from 'lucide-react';

export const SCHEMA_SQL = `
-- TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- HABILITAR RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (PERMISSIVA PARA USO INTERNO)
CREATE POLICY "Enable read access for all users" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON audit_logs FOR INSERT WITH CHECK (true);
`;

export const SEED_SQL = "";

export const Instructions = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Database size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Setup de Banco de Dados</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
              Execute o script SQL abaixo no painel do Supabase para criar as tabelas necessárias (incluindo Logs de Auditoria).
            </p>
        </div>

        {/* Code Block */}
        <div className="relative mb-8 group">
            <div className="absolute top-0 right-0 p-2">
                <button 
                    onClick={handleCopy}
                    className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-lg"
                >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 pt-12 overflow-x-auto max-h-64 border border-slate-800 shadow-inner">
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                    {SCHEMA_SQL}
                </pre>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a 
             href="https://supabase.com/dashboard/project/_/editor" 
             target="_blank"
             rel="noopener noreferrer"
             className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
             <Terminal size={16} />
             Abrir Editor SQL
          </a>
          <Link 
            to="/login"
            className="flex-1 flex items-center justify-center py-3 px-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 text-sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
};
