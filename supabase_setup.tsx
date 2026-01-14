
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Database, Copy, Terminal, FileSpreadsheet, Droplet, Waves, Box } from 'lucide-react';

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
  technicians_list JSONB DEFAULT '[]'::jsonb,
  global_frequencies JSONB DEFAULT '{}'::jsonb,
  sede_frequencies JSONB DEFAULT '{}'::jsonb
);

-- Migração segura (technicians_list)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pest_control_settings' AND column_name = 'technicians_list') THEN
        ALTER TABLE pest_control_settings ADD COLUMN technicians_list JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

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
  status TEXT DEFAULT 'PENDENTE',
  photo_url TEXT
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
-- 4. HYDRO SETTINGS & CLORO
-- =============================================
CREATE TABLE IF NOT EXISTS hydro_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  validade_certificado_meses INTEGER DEFAULT 6,
  validade_filtro_meses INTEGER DEFAULT 6,
  validade_limpeza_caixa INTEGER DEFAULT 6,
  validade_limpeza_cisterna INTEGER DEFAULT 6,
  validade_limpeza_poco INTEGER DEFAULT 6,
  validade_limpeza_meses INTEGER DEFAULT 6, -- Legado
  cloro_min FLOAT DEFAULT 1.0,
  cloro_max FLOAT DEFAULT 3.0,
  ph_min FLOAT DEFAULT 7.4,
  ph_max FLOAT DEFAULT 7.6
);

ALTER TABLE hydro_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Hydro Settings" ON hydro_settings FOR SELECT USING (true);
CREATE POLICY "Public Update Hydro Settings" ON hydro_settings FOR UPDATE USING (true);
CREATE POLICY "Public Insert Hydro Settings" ON hydro_settings FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS hydro_cloro (
  id TEXT PRIMARY KEY,
  sede_id TEXT NOT NULL,
  date DATE NOT NULL,
  cl FLOAT,
  ph FLOAT,
  medida_corretiva TEXT,
  responsavel TEXT,
  photo_url TEXT
);

-- MIGRATION CRÍTICA: Adicionar photo_url se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hydro_cloro' AND column_name = 'photo_url') THEN
        ALTER TABLE hydro_cloro ADD COLUMN photo_url TEXT;
    END IF;
END $$;

ALTER TABLE hydro_cloro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Cloro" ON hydro_cloro FOR SELECT USING (true);
CREATE POLICY "Public Write Cloro" ON hydro_cloro FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Cloro" ON hydro_cloro FOR UPDATE USING (true);

-- =============================================
-- 5. TABELAS HYDRO FALTANTES (RESERVATÓRIOS, FILTROS, CERTIFICADOS)
-- =============================================

-- Reservatórios
CREATE TABLE IF NOT EXISTS hydro_reservatorios (
  id TEXT PRIMARY KEY,
  sede_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  local TEXT NOT NULL,
  responsavel TEXT,
  data_ultima_limpeza DATE,
  proxima_limpeza DATE,
  situacao_limpeza TEXT,
  previsao_limpeza_1 DATE,
  data_limpeza_1 DATE,
  previsao_limpeza_2 DATE,
  data_limpeza_2 DATE,
  bairro TEXT,
  referencia_bomba TEXT,
  ficha_operacional TEXT,
  dados_ficha JSONB,
  ultima_troca_filtro DATE,
  proxima_troca_filtro DATE,
  situacao_filtro TEXT,
  refil TEXT,
  num_celulas INTEGER,
  capacidade TEXT
);

-- MIGRATION: dados_ficha em reservatorios
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hydro_reservatorios' AND column_name = 'dados_ficha') THEN
        ALTER TABLE hydro_reservatorios ADD COLUMN dados_ficha JSONB;
    END IF;
END $$;

ALTER TABLE hydro_reservatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Reservatorios" ON hydro_reservatorios FOR SELECT USING (true);
CREATE POLICY "Public Write Reservatorios" ON hydro_reservatorios FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Reservatorios" ON hydro_reservatorios FOR UPDATE USING (true);
CREATE POLICY "Public Delete Reservatorios" ON hydro_reservatorios FOR DELETE USING (true);

-- Certificados
CREATE TABLE IF NOT EXISTS hydro_certificados (
  id TEXT PRIMARY KEY,
  sede_id TEXT NOT NULL,
  parceiro TEXT,
  status TEXT,
  semestre TEXT,
  validade_semestre TEXT,
  data_analise DATE,
  validade DATE,
  link_micro TEXT,
  link_fisico TEXT,
  empresa TEXT,
  agendamento TEXT,
  observacao TEXT
);
ALTER TABLE hydro_certificados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Certificados" ON hydro_certificados FOR SELECT USING (true);
CREATE POLICY "Public Write Certificados" ON hydro_certificados FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Certificados" ON hydro_certificados FOR UPDATE USING (true);
CREATE POLICY "Public Delete Certificados" ON hydro_certificados FOR DELETE USING (true);

-- Filtros
CREATE TABLE IF NOT EXISTS hydro_filtros (
  id TEXT PRIMARY KEY,
  sede_id TEXT NOT NULL,
  patrimonio TEXT,
  bebedouro TEXT,
  local TEXT,
  data_troca DATE,
  proxima_troca DATE
);
ALTER TABLE hydro_filtros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Filtros" ON hydro_filtros FOR SELECT USING (true);
CREATE POLICY "Public Write Filtros" ON hydro_filtros FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Filtros" ON hydro_filtros FOR UPDATE USING (true);
CREATE POLICY "Public Delete Filtros" ON hydro_filtros FOR DELETE USING (true);

-- =============================================
-- 6. STORAGE BUCKETS
-- =============================================
-- Execute separadamente se der erro de duplicidade
INSERT INTO storage.buckets (id, name, public) VALUES ('pest-control-images', 'pest-control-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('hydro-cloro-images', 'hydro-cloro-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public Access Pest" ON storage.objects FOR SELECT USING ( bucket_id = 'pest-control-images' );
CREATE POLICY "Public Insert Pest" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'pest-control-images' );

CREATE POLICY "Public Access Cloro" ON storage.objects FOR SELECT USING ( bucket_id = 'hydro-cloro-images' );
CREATE POLICY "Public Insert Cloro" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'hydro-cloro-images' );
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

export const CERTIFICADOS_IMPORT_SQL = `
-- =============================================
-- IMPORTAÇÃO DE CERTIFICADOS (2025.2 - 2026.1)
-- =============================================

-- Limpa a tabela atual (Opcional, remova se quiser manter o histórico antigo)
DELETE FROM hydro_certificados;

-- Insere os novos dados
INSERT INTO hydro_certificados (
    id, sede_id, parceiro, status, semestre, 
    validade_semestre, data_analise, validade, 
    link_micro, link_fisico, empresa, agendamento, observacao
) VALUES
(gen_random_uuid(), 'ALD', 'ALD - VL', 'VIGENTE', '2º/2025', '2026-02-18', '2025-08-22', '2026-02-18', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'ALD', 'ALD - TP', 'VIGENTE', '2º/2025', '2026-03-16', '2025-09-17', '2026-03-16', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'ALD', 'ALD - VM', 'VIGENTE', '2º/2025', '2026-03-16', '2025-09-17', '2026-03-16', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'BN', 'BN', 'VIGENTE', '2º/2025', '2026-03-16', '2025-09-17', '2026-03-16', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'BS', 'BS', 'VIGENTE', '2º/2025', '2026-03-04', '2025-09-05', '2026-03-04', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'DL', 'DL', 'VIGENTE', '2º/2025', '2026-03-25', '2025-09-26', '2026-03-25', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'DT', 'DT', 'VIGENTE', '2º/2025', '2026-03-04', '2025-09-05', '2026-03-04', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'EUS', 'EUS', 'VIGENTE', '2º/2025', '2026-02-25', '2025-08-29', '2026-02-25', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'PE', 'PE', 'VIGENTE', '2º/2025', '2026-03-25', '2025-09-26', '2026-03-25', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'PJF', 'PJF', 'VENCIDO', '2º/2025', NULL, NULL, NULL, NULL, NULL, 'AC LAB', 'AGENDAR', '19/11/2025'),
(gen_random_uuid(), 'PNV', 'PNV', 'VIGENTE', '2º/2025', '2026-03-04', '2025-09-05', '2026-03-04', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'PQL1', 'PQL1', 'VIGENTE', '2º/2025', '2026-03-09', '2025-09-10', '2026-03-09', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'PQL2', 'PQL2', 'VIGENTE', '2º/2025', '2026-03-09', '2025-09-10', '2026-03-09', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'PQL3', 'PQL3', 'VIGENTE', '2º/2025', '2026-03-09', '2025-09-10', '2026-03-09', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'PQL3', 'FISIOTERAPIA - PQL3', 'VENCIDO', '2º/2025', NULL, NULL, NULL, NULL, NULL, 'AC LAB', 'REAGENDAR', 'AGENDAMENTO PENDENTE'),
(gen_random_uuid(), 'PSUL', 'PSUL', 'VIGENTE', '2º/2025', '2026-03-28', '2025-09-29', '2026-03-28', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'SP', 'SP', 'VIGENTE', '2º/2025', '2026-03-04', '2025-09-05', '2026-03-04', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'SUL1', 'SUL1', 'VIGENTE', '2º/2025', '2026-03-09', '2025-09-10', '2026-03-09', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'SUL2', 'SUL2', 'VIGENTE', '2º/2025', '2026-03-29', '2025-09-30', '2026-03-29', 'LINK', 'LINK', 'AC LAB', NULL, NULL),
(gen_random_uuid(), 'SUL3', 'SUL3', 'VIGENTE', '2º/2025', '2026-03-28', '2025-09-29', '2026-03-28', 'LINK', 'LINK', 'AC LAB', NULL, NULL);
`;

export const POCOS_IMPORT_SQL = `
-- =============================================
-- IMPORTAÇÃO DE POÇOS ARTESIANOS
-- =============================================

-- Limpa os poços atuais para evitar duplicidade (Opcional)
DELETE FROM hydro_reservatorios WHERE tipo = 'POCO';

-- Insere os novos dados
INSERT INTO hydro_reservatorios (
    id, sede_id, tipo, local, responsavel,
    data_ultima_limpeza, referencia_bomba,
    data_limpeza_1, situacao_limpeza, ficha_operacional, proxima_limpeza,
    ultima_troca_filtro, situacao_filtro, proxima_troca_filtro, refil
) VALUES
(gen_random_uuid(), 'ALD', 'POCO', 'SUBSOLO', 'JOSY', '2024-01-24', NULL, '2025-07-09', 'DENTRO DO PRAZO', 'LINK', '2026-07-09', '2025-07-09', 'DENTRO DO PRAZO', '2026-01-05', '10"'),
(gen_random_uuid(), 'ALD', 'POCO', 'SUBSOLO', 'JOSY', '2024-01-24', NULL, '2025-07-14', 'DENTRO DO PRAZO', 'LINK', '2026-07-14', '2025-07-14', 'DENTRO DO PRAZO', '2026-01-10', '10"'),
(gen_random_uuid(), 'BN', 'POCO', 'CORREDOR (BOSQUE)', 'REBECCA', '2024-01-01', NULL, '2025-04-19', 'DENTRO DO PRAZO', 'LINK', '2026-04-19', '2025-04-19', 'DENTRO DO PRAZO', '2025-10-16', '20"'),
(gen_random_uuid(), 'BS', 'POCO', 'RESIDÊNCIA', NULL, '2024-01-01', NULL, NULL, 'FORA DO PRAZO', 'LINK', NULL, NULL, 'NÃO POSSUI', NULL, '-'),
(gen_random_uuid(), 'BS', 'POCO', 'JARDIM', NULL, '2024-12-14', NULL, NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-06-12', 'DENTRO DO PRAZO', '2025-12-09', '10"'),
(gen_random_uuid(), 'BS', 'POCO', 'SUBSOLO', NULL, '2024-12-20', NULL, NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-06-18', 'DENTRO DO PRAZO', '2025-12-15', '10"'),
(gen_random_uuid(), 'DL', 'POCO', 'NPJ', 'RAYANNE', '2024-01-25', NULL, '2025-02-26', 'DENTRO DO PRAZO', 'LINK', '2026-02-26', NULL, 'NÃO POSSUI', NULL, '-'),
(gen_random_uuid(), 'DL', 'POCO', 'NPT', 'RAYANNE', '2024-01-30', NULL, '2025-03-11', 'DENTRO DO PRAZO', 'LINK', '2026-03-11', NULL, 'NÃO POSSUI', NULL, '-'),
(gen_random_uuid(), 'DL', 'POCO', 'SUBSOLO 02', 'RAYANNE', '2024-04-01', NULL, '2025-02-05', 'DENTRO DO PRAZO', 'LINK', '2026-02-05', '2024-09-28', 'FORA DO PRAZO', '2025-03-27', '20"'),
(gen_random_uuid(), 'DL', 'POCO', 'ESTACIONAMENTO (GUARITA)', 'RAYANNE', '2024-04-04', NULL, '2025-02-17', 'DENTRO DO PRAZO', 'LINK', '2026-02-17', '2024-10-01', 'FORA DO PRAZO', '2025-03-30', '10"'),
(gen_random_uuid(), 'DL', 'POCO', 'ESTACIONAMENTO (EXTERNO)', 'RAYANNE', '2024-04-09', NULL, '2025-02-12', 'DENTRO DO PRAZO', 'LINK', '2026-02-12', '2024-10-06', 'FORA DO PRAZO', '2025-04-04', '10"'),
(gen_random_uuid(), 'DL', 'POCO', 'QUADRA (AV. VIRGÍLIO TÁVORA)', 'RAYANNE', '2024-04-15', NULL, '2025-03-17', 'DENTRO DO PRAZO', 'LINK', '2026-03-17', '2024-10-12', 'FORA DO PRAZO', '2025-04-10', '10"'),
(gen_random_uuid(), 'DT', 'POCO', 'PORTARIA 03', 'ELANO', '2024-08-28', 'MB-37', NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-02-24', 'FORA DO PRAZO', '2025-08-23', '20"'),
(gen_random_uuid(), 'DT', 'POCO', 'CPA', 'ELANO', '2024-10-31', 'MB-133', NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-04-29', 'DENTRO DO PRAZO', '2025-10-26', '10"'),
(gen_random_uuid(), 'DT', 'POCO', 'PORTARIA 02', 'ELANO', '2024-11-09', 'MB-117', NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-05-08', 'DENTRO DO PRAZO', '2025-11-04', '10"'),
(gen_random_uuid(), 'DT', 'POCO', 'JARDIM (INFANTIL)', 'ELANO', '2024-11-22', 'MB-151', NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-05-21', 'DENTRO DO PRAZO', '2025-11-17', '20"'),
(gen_random_uuid(), 'DT', 'POCO', 'PORTARIA 04', 'ELANO', '2024-12-05', NULL, NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-06-03', 'DENTRO DO PRAZO', '2025-11-30', '10"'),
(gen_random_uuid(), 'EUS', 'POCO', 'UNIVERSIDADE', 'DÂNIA', '2024-12-17', NULL, NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-06-15', 'DENTRO DO PRAZO', '2025-12-12', '10"'),
(gen_random_uuid(), 'EUS', 'POCO', 'CONSTRUTORA', 'DÂNIA', '2024-12-17', NULL, NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-06-15', 'DENTRO DO PRAZO', '2025-12-12', '10"'),
(gen_random_uuid(), 'PE', 'POCO', 'SUBSOLO 2 (RAMPA)', 'DANIELLE', '2024-03-18', NULL, '2025-08-29', 'DENTRO DO PRAZO', 'LINK', NULL, '2024-09-14', 'FORA DO PRAZO', '2025-03-13', '10"'),
(gen_random_uuid(), 'PE', 'POCO', 'COPA (CAJUEIRO)', 'DANIELLE', '2024-10-01', NULL, '2025-08-28', 'DENTRO DO PRAZO', 'LINK', '2026-08-28', '2025-03-30', 'DENTRO DO PRAZO', '2025-09-26', '20"'),
(gen_random_uuid(), 'PE', 'POCO', 'PORTARIA', 'DANIELLE', '2024-10-16', NULL, '2025-08-26', 'DENTRO DO PRAZO', 'LINK', '2026-08-26', '2025-04-14', 'DENTRO DO PRAZO', '2025-10-11', '10"'),
(gen_random_uuid(), 'PJF', 'POCO', 'PÁTIO (CANTINA)', 'ALVARO', '2024-01-01', NULL, '2025-03-24', 'DENTRO DO PRAZO', 'LINK', '2026-03-24', '2024-06-29', 'FORA DO PRAZO', '2024-12-26', '10"'),
(gen_random_uuid(), 'PNV', 'POCO', 'ESTACIONAMENTO (LATERAL)', NULL, '2024-12-26', NULL, NULL, 'DENTRO DO PRAZO', 'LINK', NULL, '2025-06-24', 'DENTRO DO PRAZO', '2025-12-21', '10"'),
(gen_random_uuid(), 'PQL1', 'POCO', 'INFRA (COPA)', 'ALVARO', '2024-06-11', NULL, '2025-08-16', 'DENTRO DO PRAZO', 'LINK', NULL, '2024-12-08', 'FORA DO PRAZO', '2025-06-06', '20"'),
(gen_random_uuid(), 'PQL2', 'POCO', 'LOJINHA', 'ALVARO', '2024-05-22', NULL, NULL, 'FORA DO PRAZO', 'LINK', NULL, '2024-11-18', 'FORA DO PRAZO', '2025-05-17', '10"'),
(gen_random_uuid(), 'PQL3', 'POCO', 'PÁTIO (CANTINA)', 'JOÃO VICTOR', '2024-05-27', NULL, NULL, 'FORA DO PRAZO', 'LINK', NULL, '2024-11-23', 'FORA DO PRAZO', '2025-05-22', '10"'),
(gen_random_uuid(), 'PQL3', 'POCO', 'CLÍNICA DE FISIOTERAPIA', 'JOÃO VICTOR', NULL, NULL, '2025-08-18', 'DENTRO DO PRAZO', NULL, NULL, NULL, NULL, NULL, NULL),
(gen_random_uuid(), 'PSUL', 'POCO', 'SALA 03 (AUDITÓRIO)', 'LARISSA', '2024-01-01', NULL, '2025-10-11', 'DENTRO DO PRAZO', 'LINK', '2026-10-11', '2024-06-29', 'FORA DO PRAZO', '2024-12-26', '20"'),
(gen_random_uuid(), 'SP', 'POCO', 'JARDIM (JV)', NULL, NULL, NULL, '2025-01-02', 'DENTRO DO PRAZO', 'LINK', '2026-01-02', '2025-01-02', 'DENTRO DO PRAZO', '2025-07-01', '10"'),
(gen_random_uuid(), 'SP', 'POCO', 'PORTARIA (CAPELA)', NULL, NULL, NULL, '2025-01-09', 'DENTRO DO PRAZO', 'LINK', '2026-01-09', '2025-01-09', 'DENTRO DO PRAZO', '2025-07-08', '10"'),
(gen_random_uuid(), 'SUL2', 'POCO', 'INFRA (GUARITA)', 'LARISSA', '2024-05-06', NULL, '2025-09-02', 'DENTRO DO PRAZO', 'LINK', '2026-09-02', '2025-09-02', 'DENTRO DO PRAZO', '2026-03-01', '20"'),
(gen_random_uuid(), 'SUL2', 'POCO', 'QUADRA 01', 'LARISSA', '2024-05-15', NULL, '2025-08-28', 'DENTRO DO PRAZO', 'LINK', '2026-08-28', '2025-08-28', 'DENTRO DO PRAZO', '2026-02-24', '10"'),
(gen_random_uuid(), 'SUL3', 'POCO', 'ESTACIONAMENTO (QUADRA)', 'LARISSA', '2024-04-24', NULL, '2025-09-08', 'DENTRO DO PRAZO', 'LINK', '2026-09-08', '2024-10-21', 'FORA DO PRAZO', '2025-04-19', '10"'),
(gen_random_uuid(), 'SUL3', 'POCO', 'ESTACIONAMENTO (GUARITA)', 'LARISSA', '2024-04-29', NULL, '2025-09-03', 'DENTRO DO PRAZO', 'LINK', '2026-09-03', '2024-10-26', 'FORA DO PRAZO', '2025-04-24', '10"');
`;

export const CISTERNAS_IMPORT_SQL = `
-- =============================================
-- IMPORTAÇÃO DE CISTERNAS
-- =============================================

-- Limpa as cisternas atuais para evitar duplicidade (Opcional)
DELETE FROM hydro_reservatorios WHERE tipo = 'CISTERNA';

-- Insere os novos dados
INSERT INTO hydro_reservatorios (
    id, sede_id, tipo, local, responsavel,
    num_celulas, capacidade,
    previsao_limpeza_1, data_limpeza_1,
    previsao_limpeza_2, data_limpeza_2,
    situacao_limpeza, proxima_limpeza
) VALUES
(gen_random_uuid(), 'ALD', 'CISTERNA', 'SUBSOLO', 'JOSY', 2, '80.000', NULL, '2025-01-07', '2025-07-06', '2025-08-11', 'DENTRO DO PRAZO', '2026-02-11'),
(gen_random_uuid(), 'BS', 'CISTERNA', 'SUBSOLO', 'HÉRIC', 1, '116.000', '2025-06-14', NULL, NULL, '2025-07-05', 'DENTRO DO PRAZO', '2026-01-05'),
(gen_random_uuid(), 'DL', 'CISTERNA', 'SUBSOLO 02', 'RAYANNE', 2, '57.600', '2025-06-07', NULL, NULL, '2025-08-15', 'DENTRO DO PRAZO', '2026-02-15'),
(gen_random_uuid(), 'DT', 'CISTERNA', 'PÁTIO DOS ELEVADORES', 'ALVÁRO', 1, '50.600', NULL, NULL, NULL, NULL, 'FORA DO PRAZO', NULL),
(gen_random_uuid(), 'PE', 'CISTERNA', 'TERRENO PRÓX. ALMOX.', 'DANIELLE', 2, '101.200', '2025-06-17', NULL, NULL, '2025-07-05', 'DENTRO DO PRAZO', '2026-01-05'),
(gen_random_uuid(), 'PE', 'CISTERNA', 'SUBSOLO 01', 'DANIELLE', 4, '30.000', '2025-06-17', NULL, NULL, '2025-07-03', 'DENTRO DO PRAZO', '2026-01-03'),
(gen_random_uuid(), 'PJF', 'CISTERNA', 'PÁTIO (ENTRADA)', 'RAFAEL', 1, '15.200', NULL, '2025-04-04', '2025-10-01', NULL, 'DENTRO DO PRAZO', '2025-10-01'),
(gen_random_uuid(), 'PNV', 'CISTERNA', 'PÁTIO (TÉRREO)', 'HÉRIC', 2, '31.200', '2025-06-26', NULL, NULL, '2025-07-23', 'DENTRO DO PRAZO', '2026-01-23'),
(gen_random_uuid(), 'PQL1', 'CISTERNA', 'ENTRADA (AV. HUMB. MONTE)', 'RAFAEL', 1, '78.500', '2025-06-27', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-06-27'),
(gen_random_uuid(), 'PQL2', 'CISTERNA', 'PÁTIO (CANTINA)', 'RAFAEL', 1, '50.400', '2025-06-18', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-06-18'),
(gen_random_uuid(), 'PQL3', 'CISTERNA', 'SUBSOLO (CAPELA)', 'NERISSA', 2, '68.000', NULL, '2025-01-23', '2025-07-22', NULL, 'DENTRO DO PRAZO', '2025-07-22'),
(gen_random_uuid(), 'SUL2', 'CISTERNA', 'SUBSOLO', 'LARISSA', 2, '105.000', '2025-06-23', NULL, NULL, '2025-07-26', 'DENTRO DO PRAZO', '2026-01-26');
`;

export const CAIXAS_IMPORT_SQL = `
-- =============================================
-- IMPORTAÇÃO DE CAIXAS D'ÁGUA
-- =============================================

-- Limpa as caixas atuais para evitar duplicidade (Opcional)
DELETE FROM hydro_reservatorios WHERE tipo = 'CAIXA';

-- Insere os novos dados
INSERT INTO hydro_reservatorios (
    id, sede_id, tipo, local, responsavel,
    num_celulas, capacidade,
    previsao_limpeza_1, data_limpeza_1,
    previsao_limpeza_2, data_limpeza_2,
    situacao_limpeza, proxima_limpeza
) VALUES
(gen_random_uuid(), 'ALD', 'CAIXA', 'BLOCO A', 'JOZY', 2, '80.000', '2025-06-30', NULL, NULL, '2025-08-30', 'DENTRO DO PRAZO', '2026-02-28'),
(gen_random_uuid(), 'BN', 'CAIXA', 'BLOCO A  (1º ANDAR)', 'REBECCA', 2, '79.000', '2025-05-28', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-05-28'),
(gen_random_uuid(), 'BN', 'CAIXA', 'QUADRA', 'REBECCA', 1, NULL, NULL, NULL, NULL, NULL, 'DESATIVADO', NULL),
(gen_random_uuid(), 'BN', 'CAIXA', 'BOSQUE (BIBLIOTECA)', 'REBECCA', 1, '10.000', NULL, NULL, NULL, NULL, 'DESATIVADO', NULL),
(gen_random_uuid(), 'BS', 'CAIXA', 'BLOCO C', 'HÉRIC', 2, '40.000', '2025-06-11', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-06-11'),
(gen_random_uuid(), 'BS', 'CAIXA', 'OBSERVATÓRIO', 'HÉRIC', 2, '80.000', NULL, '2025-01-18', '2025-07-17', NULL, 'DENTRO DO PRAZO', '2025-07-17'),
(gen_random_uuid(), 'DL', 'CAIXA', '16º ANDAR', 'RAYANNE', 2, '138.400', '2025-06-28', NULL, NULL, '2025-08-15', 'DENTRO DO PRAZO', '2026-02-15'),
(gen_random_uuid(), 'DT', 'CAIXA', '2º ANDAR (PDT)', 'ALVARO', 1, '10.000', NULL, '2025-03-05', '2025-09-01', NULL, 'DENTRO DO PRAZO', '2025-09-01'),
(gen_random_uuid(), 'DT', 'CAIXA', '3º ANDAR (DT1 VELHO)', 'ALVARO', 2, '50.000', NULL, '2025-03-05', '2025-09-01', NULL, 'DENTRO DO PRAZO', '2025-09-01'),
(gen_random_uuid(), 'DT', 'CAIXA', '5º ANDAR (DT1 NOVO)', 'ALVARO', 2, '44.000', '2025-06-11', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-06-11'),
(gen_random_uuid(), 'DT', 'CAIXA', '10º ANDAR', 'ALVARO', 1, '60.000', NULL, NULL, NULL, NULL, 'FORA DO PRAZO', NULL),
(gen_random_uuid(), 'DT', 'CAIXA', 'CPA', 'ALVARO', 2, '4.000', NULL, NULL, NULL, NULL, 'FORA DO PRAZO', NULL),
(gen_random_uuid(), 'DT', 'CAIXA', 'IDIOMAS', 'ALVARO', 1, '2.000', NULL, NULL, NULL, NULL, 'FORA DO PRAZO', NULL),
(gen_random_uuid(), 'DT', 'CAIXA', 'VIVÊNCIA DOS FUNCIONÁRIOS', 'ALVARO', 2, '20.000', NULL, NULL, NULL, NULL, 'DESATIVADO', NULL),
(gen_random_uuid(), 'EUS', 'CAIXA', '4º ANDAR (ABASTECIMENTO)', 'DÂNIA', 2, '16.400', NULL, '2025-03-08', '2025-09-04', '2025-07-26', 'DENTRO DO PRAZO', '2026-01-26'),
(gen_random_uuid(), 'EUS', 'CAIXA', '4º ANDAR (REÚSO)', 'DÂNIA', 2, '16.400', NULL, '2025-04-05', '2025-10-02', '2025-07-26', 'DENTRO DO PRAZO', '2026-01-26'),
(gen_random_uuid(), 'PE', 'CAIXA', '5º ANDAR', 'DANIELLE', 2, '79.000', NULL, '2025-01-17', '2025-07-16', '2025-07-07', 'DENTRO DO PRAZO', '2026-01-07'),
(gen_random_uuid(), 'PE', 'CAIXA', '12º ANDAR', 'DANIELLE', 2, '81.000', NULL, '2025-01-22', '2025-07-21', '2025-07-07', 'DENTRO DO PRAZO', '2026-01-07'),
(gen_random_uuid(), 'PE', 'CAIXA', 'ESTACIONAMENTO (CES)', 'DANIELLE', 3, '7.500', NULL, NULL, NULL, NULL, 'DESATIVADO', NULL),
(gen_random_uuid(), 'PE', 'CAIXA', 'GASTRONOMIA', 'DANIELLE', 1, '10.000', NULL, '2025-01-24', '2025-07-23', '2025-07-15', 'DENTRO DO PRAZO', '2026-01-15'),
(gen_random_uuid(), 'PJF', 'CAIXA', 'CANTINA', 'RAFAEL', 1, '21.000', NULL, NULL, NULL, NULL, 'FORA DO PRAZO', NULL),
(gen_random_uuid(), 'PJF', 'CAIXA', 'BIBLIOTECA', 'RAFAEL', 1, '9.000', NULL, '2025-01-15', '2025-07-14', NULL, 'DENTRO DO PRAZO', '2025-07-14'),
(gen_random_uuid(), 'PNV', 'CAIXA', '4º ANDAR', 'HÉRIC', 1, '24.500', '2025-06-26', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-06-26'),
(gen_random_uuid(), 'PQL1', 'CAIXA', '4º ANDAR', 'RAFAEL', 2, '69.900', '2025-06-30', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-06-30'),
(gen_random_uuid(), 'PQL2', 'CAIXA', '5º ANDAR', 'RAFAEL', 2, '56.600', '2025-06-26', NULL, NULL, NULL, 'DENTRO DO PRAZO', '2025-06-26'),
(gen_random_uuid(), 'PQL3', 'CAIXA', '4º ANDAR', 'NERISSA', 2, '68.400', NULL, '2025-01-03', '2025-07-02', NULL, 'DENTRO DO PRAZO', '2025-07-02'),
(gen_random_uuid(), 'PSUL', 'CAIXA', '1º ANDAR', 'LARISSA', 2, '21.600', '2025-06-18', NULL, NULL, '2025-07-22', 'DENTRO DO PRAZO', '2026-01-22'),
(gen_random_uuid(), 'SP', 'CAIXA', 'JV', 'HÉRIC', 2, '132.000', '2025-06-30', NULL, NULL, '2025-07-25', 'DENTRO DO PRAZO', '2026-01-25'),
(gen_random_uuid(), 'SP', 'CAIXA', 'SP', 'HÉRIC', 2, '25.000', NULL, '2025-01-07', '2025-07-06', '2025-08-14', 'DENTRO DO PRAZO', '2026-02-14'),
(gen_random_uuid(), 'SUL2', 'CAIXA', '5º ANDAR', 'LARISSA', 2, '118.000', '2025-06-28', NULL, NULL, '2025-08-16', 'DENTRO DO PRAZO', '2026-02-16'),
(gen_random_uuid(), 'SUL3', 'CAIXA', '6º ANDAR', 'LARISSA', 2, '63.000', NULL, '2025-01-02', '2025-07-01', '2025-07-24', 'DENTRO DO PRAZO', '2026-01-24'),
(gen_random_uuid(), 'SUL3', 'CAIXA', '6º ANDAR (REÚSO)', 'LARISSA', 1, '21.000', NULL, NULL, NULL, NULL, 'DESATIVADO', NULL);
`;

export const Instructions = () => {
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [copiedCert, setCopiedCert] = useState(false);
  const [copiedPocos, setCopiedPocos] = useState(false);
  const [copiedCisternas, setCopiedCisternas] = useState(false);
  const [copiedCaixas, setCopiedCaixas] = useState(false);

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

  const handleCopyCert = () => {
    navigator.clipboard.writeText(CERTIFICADOS_IMPORT_SQL);
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2000);
  };

  const handleCopyPocos = () => {
    navigator.clipboard.writeText(POCOS_IMPORT_SQL);
    setCopiedPocos(true);
    setTimeout(() => setCopiedPocos(false), 2000);
  };

  const handleCopyCisternas = () => {
    navigator.clipboard.writeText(CISTERNAS_IMPORT_SQL);
    setCopiedCisternas(true);
    setTimeout(() => setCopiedCisternas(false), 2000);
  };

  const handleCopyCaixas = () => {
    navigator.clipboard.writeText(CAIXAS_IMPORT_SQL);
    setCopiedCaixas(true);
    setTimeout(() => setCopiedCaixas(false), 2000);
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

        {/* Step 3: Certificados Import */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-cyan-500"/> 3. Importar Certificados
                </h3>
                <button 
                    onClick={handleCopyCert}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-500 flex items-center gap-1"
                >
                    {copiedCert ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedCert ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                <pre className="text-[10px] font-mono text-cyan-400 whitespace-pre-wrap leading-relaxed">
                    {CERTIFICADOS_IMPORT_SQL}
                </pre>
            </div>
        </div>

        {/* Step 4: Pocos Import */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Droplet size={16} className="text-blue-500"/> 4. Importar Poços
                </h3>
                <button 
                    onClick={handleCopyPocos}
                    className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1"
                >
                    {copiedPocos ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedPocos ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400 whitespace-pre-wrap leading-relaxed">
                    {POCOS_IMPORT_SQL}
                </pre>
            </div>
        </div>

        {/* Step 5: Cisternas Import */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Waves size={16} className="text-indigo-500"/> 5. Importar Cisternas
                </h3>
                <button 
                    onClick={handleCopyCisternas}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
                >
                    {copiedCisternas ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedCisternas ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                <pre className="text-[10px] font-mono text-indigo-400 whitespace-pre-wrap leading-relaxed">
                    {CISTERNAS_IMPORT_SQL}
                </pre>
            </div>
        </div>

        {/* Step 6: Caixas Import */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Box size={16} className="text-purple-500"/> 6. Importar Caixas D'água
                </h3>
                <button 
                    onClick={handleCopyCaixas}
                    className="text-xs font-bold text-purple-600 hover:text-purple-500 flex items-center gap-1"
                >
                    {copiedCaixas ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedCaixas ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                <pre className="text-[10px] font-mono text-purple-400 whitespace-pre-wrap leading-relaxed">
                    {CAIXAS_IMPORT_SQL}
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
