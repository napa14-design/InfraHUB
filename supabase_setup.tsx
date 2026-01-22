
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Database, Copy, Terminal, Code2, Server, AlertTriangle } from 'lucide-react';

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

export const EDGE_FUNCTION_CODE = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Trata preflight (OPTIONS) - Necessário para evitar erro "Failed to send request"
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. CONFIGURAÇÃO DO CLIENTE ADMIN
    // ATENÇÃO: Forçamos o uso desta chave string direta para ignorar 
    // qualquer configuração de Secrets incorreta no painel do Supabase.
    const serviceRoleKey = 'SERVICE_ROLE_KEY_REMOVED';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://fkgjksidezjaqupkdyev.supabase.co';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Parse Body
    const { userId, newPassword } = await req.json().catch(() => ({}));

    if (!userId || !newPassword) {
        return new Response(
            JSON.stringify({ error: "Faltando userId ou newPassword no corpo da requisição" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    // 3. Atualiza senha
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (authError) {
        return new Response(
            JSON.stringify({ error: authError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    return new Response(
      JSON.stringify({ message: "Senha atualizada com sucesso" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})`;

export const Instructions = () => {
  const [activeTab, setActiveTab] = useState<'SQL' | 'EDGE'>('EDGE');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = activeTab === 'SQL' ? SCHEMA_SQL : EDGE_FUNCTION_CODE;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full mb-4 shadow-inner">
              <Server size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Setup do Sistema</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              Siga os passos abaixo para configurar o backend.
            </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button 
                onClick={() => setActiveTab('EDGE')}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'EDGE' ? 'bg-white dark:bg-slate-900 text-cyan-600 border-b-2 border-cyan-500' : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Code2 size={16}/> 1. Edge Function
            </button>
            <button 
                onClick={() => setActiveTab('SQL')}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'SQL' ? 'bg-white dark:bg-slate-900 text-cyan-600 border-b-2 border-cyan-500' : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Database size={16}/> 2. Banco de Dados
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-slate-100 dark:bg-slate-950">
            
            {activeTab === 'EDGE' && (
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                        <strong className="block mb-1 text-sm">CORREÇÃO DE CHAVE (IMPORTANTE):</strong>
                        <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-700 dark:text-slate-300">
                            <li>Este código foi modificado para <strong>IGNORAR</strong> as Secrets do Painel que podem estar erradas.</li>
                            <li>Ele usa diretamente a chave Service Role correta no código.</li>
                            <li>Copie e faça o deploy novamente: <code>supabase functions deploy admin-reset-password</code></li>
                        </ol>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {activeTab === 'EDGE' ? 'Código Final (admin-reset-password)' : 'SQL Editor'}
                </h3>
                <button 
                    onClick={handleCopy}
                    className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-cyan-600 hover:text-cyan-500 hover:border-cyan-500 transition-all flex items-center gap-2 shadow-sm"
                >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar Código'}
                </button>
            </div>
            
            <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-auto border border-slate-800 shadow-inner relative group">
                <pre className="text-[11px] font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
                    {activeTab === 'SQL' ? SCHEMA_SQL : EDGE_FUNCTION_CODE}
                </pre>
            </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <Link 
            to="/login"
            className="flex items-center text-slate-500 hover:text-cyan-600 font-mono text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" /> Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
};
