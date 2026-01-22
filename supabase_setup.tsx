
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Database, Copy, Terminal } from 'lucide-react';

export const SCHEMA_SQL = `
-- ====================================================================
-- MIGRAÇÃO DE BANCO DE DADOS: CONFIGURAÇÕES INDIVIDUAIS DE RESERVATÓRIOS
-- ====================================================================

-- 1. Adicionar colunas individuais para cada tipo de reservatório
ALTER TABLE hydro_settings 
ADD COLUMN IF NOT EXISTS validade_limpeza_poco INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS validade_limpeza_caixa INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS validade_limpeza_cisterna INTEGER DEFAULT 6;

-- 2. Adicionar coluna JSONB para armazenar a Ficha Técnica completa do Poço
-- Isso permite salvar dados complexos (checklist, materiais, dados da bomba)
ALTER TABLE hydro_reservatorios
ADD COLUMN IF NOT EXISTS dados_ficha JSONB;

-- 3. Atualizar a linha de configuração padrão (id='default')
INSERT INTO hydro_settings (id, validade_limpeza_poco, validade_limpeza_caixa, validade_limpeza_cisterna, cloro_min, cloro_max, ph_min, ph_max)
VALUES ('default', 12, 6, 6, 1.0, 3.0, 7.4, 7.6)
ON CONFLICT (id) DO UPDATE 
SET 
    validade_limpeza_poco = EXCLUDED.validade_limpeza_poco,
    validade_limpeza_caixa = EXCLUDED.validade_limpeza_caixa,
    validade_limpeza_cisterna = EXCLUDED.validade_limpeza_cisterna;

-- 4. Verificação final
SELECT * FROM hydro_settings;
`;

export const Instructions = () => {
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Database size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Atualização de Estrutura</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
              Execute o script abaixo no Editor SQL do Supabase para adicionar suporte a validades diferenciadas e armazenamento da Ficha Técnica.
            </p>
        </div>

        {/* Migration Script */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Script de Migração</h3>
                <button 
                    onClick={handleCopySchema}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-500 flex items-center gap-1"
                >
                    {copiedSchema ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedSchema ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-64 border border-slate-800 shadow-inner">
                <pre className="text-[11px] font-mono text-cyan-400 whitespace-pre-wrap leading-relaxed">
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
             Abrir Editor Supabase
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
