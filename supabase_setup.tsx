
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Database, Copy, Terminal } from 'lucide-react';

export const SCHEMA_SQL = `
-- =============================================
-- 1. LOGS DE AUDITORIA
-- =============================================
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

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON audit_logs FOR INSERT WITH CHECK (true);

-- =============================================
-- 2. CONTROLE DE PRAGAS (PEST CONTROL)
-- =============================================

CREATE TABLE IF NOT EXISTS pest_control_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  pest_types TEXT[] DEFAULT '{}',
  technicians TEXT[] DEFAULT '{}',
  global_frequencies JSONB DEFAULT '{}'::jsonb,
  sede_frequencies JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS pest_control_entries (
  id TEXT PRIMARY KEY,
  sede_id TEXT NOT NULL,
  item TEXT NOT NULL,
  target TEXT NOT NULL,
  product TEXT,
  frequency TEXT,
  method TEXT,
  technician TEXT,
  scheduled_date DATE NOT NULL,
  performed_date DATE,
  observation TEXT,
  status TEXT DEFAULT 'PENDENTE'
);

ALTER TABLE pest_control_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_control_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Settings" ON pest_control_settings FOR SELECT USING (true);
CREATE POLICY "Public Write Settings" ON pest_control_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Settings" ON pest_control_settings FOR UPDATE USING (true);

CREATE POLICY "Public Read Entries" ON pest_control_entries FOR SELECT USING (true);
CREATE POLICY "Public Write Entries" ON pest_control_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Entries" ON pest_control_entries FOR UPDATE USING (true);
CREATE POLICY "Public Delete Entries" ON pest_control_entries FOR DELETE USING (true);

-- =============================================
-- 3. REGRAS DE NOTIFICAÇÃO
-- =============================================

CREATE TABLE IF NOT EXISTS notification_rules (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  warning_days INTEGER DEFAULT 30,
  critical_days INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true
);

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Rules" ON notification_rules FOR SELECT USING (true);
CREATE POLICY "Public Write Rules" ON notification_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Rules" ON notification_rules FOR UPDATE USING (true);

-- =============================================
-- 4. HYDRO SETTINGS (ATUALIZADO)
-- =============================================
CREATE TABLE IF NOT EXISTS hydro_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  validade_certificado_meses INTEGER DEFAULT 6,
  validade_filtro_meses INTEGER DEFAULT 6,
  -- Campos novos para reservatórios específicos
  validade_limpeza_caixa INTEGER DEFAULT 6,
  validade_limpeza_cisterna INTEGER DEFAULT 6,
  validade_limpeza_poco INTEGER DEFAULT 6,
  -- Mantendo legado por segurança
  validade_limpeza_meses INTEGER DEFAULT 6,
  
  cloro_min FLOAT DEFAULT 1.0,
  cloro_max FLOAT DEFAULT 3.0,
  ph_min FLOAT DEFAULT 7.4,
  ph_max FLOAT DEFAULT 7.6
);

ALTER TABLE hydro_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Hydro Settings" ON hydro_settings FOR SELECT USING (true);
CREATE POLICY "Public Update Hydro Settings" ON hydro_settings FOR UPDATE USING (true);
CREATE POLICY "Public Insert Hydro Settings" ON hydro_settings FOR INSERT WITH CHECK (true);
`;

export const SEED_SQL = `
-- =============================================
-- DADOS INICIAIS (SEED)
-- =============================================

INSERT INTO pest_control_settings (id, pest_types, technicians, global_frequencies, sede_frequencies)
VALUES (
  'default',
  ARRAY['Rato / Roedores', 'Barata / Escorpião', 'Muriçoca / Mosquitos', 'Cupim', 'Formiga', 'Carrapato'],
  ARRAY['Fabio', 'Bernardo', 'Santana', 'Fernando', 'Chagas', 'Paulo', 'Equipe Externa'],
  '{"Rato / Roedores": 15, "Barata / Escorpião": 15, "Muriçoca / Mosquitos": 7, "Cupim": 180, "Formiga": 30, "Carrapato": 30}'::jsonb,
  '{}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hydro_settings (id, validade_limpeza_caixa, validade_limpeza_cisterna, validade_limpeza_poco)
VALUES ('default', 6, 6, 6)
ON CONFLICT (id) DO NOTHING;

-- Inserir regras padrão de notificação
INSERT INTO notification_rules (id, module_id, name, description, warning_days, critical_days, enabled) VALUES
('rule_cert', 'hydrosys', 'Certificados de Potabilidade', 'Monitora a data de validade dos laudos.', 30, 0, true),
('rule_filtros', 'hydrosys', 'Troca de Filtros', 'Monitora a data da próxima troca de elementos filtrantes.', 15, 0, true),
('rule_res', 'hydrosys', 'Limpeza de Reservatórios', 'Monitora datas de limpeza de Caixas e Cisternas.', 30, 7, true),
('rule_pest', 'pestcontrol', 'Controle de Pragas', 'Monitora agendamentos de dedetização e iscagem.', 5, 0, true)
ON CONFLICT (id) DO NOTHING;
`;

export const Instructions = () => {
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(SEED_SQL);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Database size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Setup de Banco de Dados</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
              Siga os passos abaixo no painel do Supabase para configurar as tabelas e dados iniciais.
            </p>
        </div>

        {/* Step 1: Schema */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">1. Criação de Tabelas</h3>
                <button 
                    onClick={handleCopySchema}
                    className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1"
                >
                    {copiedSchema ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedSchema ? 'Copiado!' : 'Copiar Script'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                    {SCHEMA_SQL}
                </pre>
            </div>
        </div>

        {/* Step 2: Seed */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">2. Dados Iniciais (Opcional)</h3>
                <button 
                    onClick={handleCopySeed}
                    className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1"
                >
                    {copiedSeed ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedSeed ? 'Copiado!' : 'Copiar Seed'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400 whitespace-pre-wrap leading-relaxed">
                    {SEED_SQL}
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
             Ir para Editor SQL (Supabase)
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
