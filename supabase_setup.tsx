
import React from 'react';

export const Instructions = () => (
  <div className="p-8 space-y-4">
    <h1 className="text-2xl font-bold">Instruções de Configuração do Banco de Dados</h1>
    <p>
      Como você não conseguiu acessar os arquivos .sql, copiei o conteúdo para as constantes abaixo.
      Copie o texto (sem as aspas) e execute no <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" className="text-blue-600 underline">SQL Editor do Supabase</a>.
    </p>
    <div className="bg-slate-100 p-4 rounded">
      <strong>Passo 1:</strong> Copie o conteúdo de <code>SCHEMA_SQL</code> e execute para criar as tabelas.
    </div>
    <div className="bg-slate-100 p-4 rounded">
      <strong>Passo 2:</strong> Copie o conteúdo de <code>SEED_SQL</code> e execute para popular os dados iniciais.
    </div>
  </div>
);

// ==========================================
// PASSO 1: SCHEMA (ESTRUTURA DAS TABELAS)
// ==========================================
export const SCHEMA_SQL = `
-- Habilita extensão de UUID
create extension if not exists "uuid-ossp";

-- 1. Organizations
create table if not exists public.organizations (
  id text primary key,
  name text not null,
  logo_url text
);

-- 2. Regions
create table if not exists public.regions (
  id text primary key,
  organization_id text references public.organizations(id) on delete cascade,
  name text not null
);

-- 3. Sedes
create table if not exists public.sedes (
  id text primary key,
  region_id text references public.regions(id) on delete cascade,
  name text not null,
  address text
);

-- 4. Locais
create table if not exists public.locais (
  id text primary key,
  sede_id text references public.sedes(id) on delete cascade,
  name text not null,
  tipo text
);

-- 5. Profiles (Usuários vinculados ao Auth do Supabase)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  role text check (role in ('ADMIN', 'GESTOR', 'OPERATIONAL')) default 'OPERATIONAL',
  status text check (status in ('ACTIVE', 'INACTIVE')) default 'ACTIVE',
  is_first_login boolean default true,
  organization_id text references public.organizations(id),
  region_id text references public.regions(id),
  sede_ids text[], -- Array de IDs das sedes que o usuário tem acesso
  created_at timestamptz default now()
);

-- 6. App Modules
create table if not exists public.app_modules (
  id text primary key,
  title text not null,
  description text,
  icon_name text,
  min_role text,
  path text,
  status text check (status in ('NORMAL', 'WARNING', 'CRITICAL', 'MAINTENANCE')),
  category text,
  type text check (type in ('INTERNAL', 'EXTERNAL'))
);

-- 7. Notifications
create table if not exists public.notifications (
  id text primary key,
  title text not null,
  message text not null,
  type text check (type in ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
  read boolean default false,
  timestamp timestamptz default now(),
  link text,
  module_source text
);

-- 8. Notification Rules (Configurações)
create table if not exists public.notification_rules (
  id text primary key,
  module_id text,
  name text,
  description text,
  warning_days int,
  critical_days int,
  enabled boolean default true
);

-- --- HYDROSYS TABLES ---

-- 9. Hydro Settings
create table if not exists public.hydro_settings (
  id text primary key default 'default',
  validade_certificado_meses int default 6,
  validade_filtro_meses int default 6,
  validade_limpeza_meses int default 6,
  cloro_min float default 1.0,
  cloro_max float default 3.0,
  ph_min float default 7.4,
  ph_max float default 7.6
);

-- 10. Hydro Certificados
create table if not exists public.hydro_certificados (
  id text primary key,
  sede_id text references public.sedes(id) on delete cascade,
  parceiro text,
  status text,
  semestre text,
  validade_semestre date,
  data_analise date,
  validade date,
  link_micro text,
  link_fisico text,
  empresa text,
  agendamento text,
  observacao text,
  created_at timestamptz default now()
);

-- 11. Hydro Cloro Entries
create table if not exists public.hydro_cloro (
  id text primary key,
  sede_id text references public.sedes(id) on delete cascade,
  date date not null,
  cl float,
  ph float,
  medida_corretiva text,
  responsavel text,
  created_at timestamptz default now()
);

-- 12. Hydro Filtros
create table if not exists public.hydro_filtros (
  id text primary key,
  sede_id text references public.sedes(id) on delete cascade,
  patrimonio text,
  bebedouro text,
  local text,
  data_troca date,
  proxima_troca date,
  created_at timestamptz default now()
);

-- 13. Hydro Reservatorios (Poços, Cisternas, Caixas)
create table if not exists public.hydro_reservatorios (
  id text primary key,
  sede_id text references public.sedes(id) on delete cascade,
  tipo text check (tipo in ('POCO', 'CISTERNA', 'CAIXA')),
  local text,
  responsavel text,
  
  -- Controle de Limpeza (Comum)
  data_ultima_limpeza date,
  proxima_limpeza date,
  situacao_limpeza text,
  
  -- Específico Poços
  bairro text,
  referencia_bomba text,
  ficha_operacional text,
  
  -- Específico Filtro do Poço
  ultima_troca_filtro date,
  proxima_troca_filtro date,
  situacao_filtro text,
  refil text,

  -- Específico Cisternas/Caixas
  num_celulas int,
  capacidade text,
  
  -- Cronograma Semestral
  previsao_limpeza_1 date,
  data_limpeza_1 date,
  previsao_limpeza_2 date,
  data_limpeza_2 date,
  
  created_at timestamptz default now()
);

-- ==========================
-- ROW LEVEL SECURITY (RLS)
-- ==========================
-- Para este exemplo, vamos permitir leitura/escrita para usuários autenticados.
-- Em produção, refine essas políticas.

alter table public.organizations enable row level security;
alter table public.regions enable row level security;
alter table public.sedes enable row level security;
alter table public.locais enable row level security;
alter table public.profiles enable row level security;
alter table public.app_modules enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_rules enable row level security;
alter table public.hydro_settings enable row level security;
alter table public.hydro_certificados enable row level security;
alter table public.hydro_cloro enable row level security;
alter table public.hydro_filtros enable row level security;
alter table public.hydro_reservatorios enable row level security;

-- Política Genérica: Permitir tudo para usuários logados
create policy "Enable all for authenticated users" on public.organizations for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.regions for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.sedes for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.locais for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.profiles for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.app_modules for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.notifications for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.notification_rules for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.hydro_settings for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.hydro_certificados for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.hydro_cloro for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.hydro_filtros for all using (auth.role() = 'authenticated');
create policy "Enable all for authenticated users" on public.hydro_reservatorios for all using (auth.role() = 'authenticated');

-- Trigger para criar Profile automaticamente ao criar usuário no Auth (Opcional, mas recomendado)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'OPERATIONAL');
  return new;
end;
$$ language plpgsql security definer;

-- Remove a trigger se existir para recriar
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;

// ==========================================
// PASSO 2: SEED (DADOS INICIAIS)
// ==========================================
export const SEED_SQL = \`
-- Limpar dados existentes (opcional, cuidado em produção)
-- truncate table public.hydro_reservatorios cascade;
-- truncate table public.hydro_filtros cascade;
-- truncate table public.hydro_cloro cascade;
-- truncate table public.hydro_certificados cascade;
-- truncate table public.locais cascade;
-- truncate table public.sedes cascade;
-- truncate table public.regions cascade;
-- truncate table public.organizations cascade;
-- truncate table public.app_modules cascade;

-- 1. Organizations
INSERT INTO public.organizations (id, name) VALUES
('org-colegio', 'Colégio'),
('org-uni', 'Universidade')
ON CONFLICT (id) DO NOTHING;

-- 2. Regions
INSERT INTO public.regions (id, organization_id, name) VALUES
('reg-dt', 'org-colegio', 'Região Dionísio Torres'),
('reg-ald-col', 'org-colegio', 'Região Aldeota'),
('reg-pql-col', 'org-colegio', 'Região Parquelândia'),
('reg-sul', 'org-colegio', 'Região Sul'),
('reg-benfica', 'org-colegio', 'Região Benfica'),
('reg-campus', 'org-uni', 'Campus Universitários')
ON CONFLICT (id) DO NOTHING;

-- 3. Sedes
INSERT INTO public.sedes (id, region_id, name) VALUES
-- Colégio
('DT', 'reg-dt', 'DT (Sede Principal)'),
('DT1', 'reg-dt', 'DT 1'),
('DT2', 'reg-dt', 'DT 2'),
('PDT', 'reg-dt', 'PDT'),
('IDIOMAS', 'reg-dt', 'IDIOMAS'),
('BS', 'reg-ald-col', 'BS'),
('SP', 'reg-ald-col', 'SP'),
('PNV', 'reg-ald-col', 'PNV'),
('PQL1', 'reg-pql-col', 'PQL 1'),
('PQL2', 'reg-pql-col', 'PQL 2'),
('PJF', 'reg-pql-col', 'PJF'),
('SUL1', 'reg-sul', 'SUL 1'),
('SUL2', 'reg-sul', 'SUL 2'),
('SUL3', 'reg-sul', 'SUL 3'),
('PSUL', 'reg-sul', 'PSUL'),
('BN', 'reg-benfica', 'BN (Colégio)'),
-- Universidade
('ALD', 'reg-campus', 'ALD (Campus Aldeota)'),
('PQL3', 'reg-campus', 'PQL 3 (Campus Parquelândia)'),
('BN-UNI', 'reg-campus', 'BN (Universidade)'),
('DL', 'reg-campus', 'DL (Dom Luís)'),
('EUS', 'reg-campus', 'EUS (Eusébio)'),
('PE', 'reg-campus', 'PE (Parque Ecológico)')
ON CONFLICT (id) DO NOTHING;

-- 4. App Modules
INSERT INTO public.app_modules (id, title, description, icon_name, min_role, path, status, category, type) VALUES
('hydrosys', 'HydroSys', 'Gestão completa de qualidade da água e reservatórios.', 'Droplets', 'OPERATIONAL', '/module/hydrosys', 'NORMAL', 'OPERATIONAL', 'INTERNAL'),
('user-management', 'Gestão de Usuários', 'Controle de acesso, criação e auditoria de contas.', 'Users', 'ADMIN', '/admin/users', 'NORMAL', 'ADMIN', 'INTERNAL'),
('org-structure', 'Estrutura Organizacional', 'Gerenciar Instituições, Regiões, Sedes e Locais.', 'Building2', 'ADMIN', '/admin/org', 'NORMAL', 'ADMIN', 'INTERNAL'),
('audit-logs', 'Logs de Auditoria', 'Rastreamento de atividades e segurança do sistema.', 'FileText', 'ADMIN', '/admin/logs', 'WARNING', 'ADMIN', 'INTERNAL'),
('sales-dashboard', 'Vendas & Metas', 'Acompanhamento de performance comercial em tempo real.', 'BarChart3', 'GESTOR', '/module/sales', 'NORMAL', 'ANALYTICS', 'INTERNAL'),
('google-analytics', 'Google Analytics', 'Acesso externo aos dados de tráfego web.', 'Globe', 'GESTOR', 'https://analytics.google.com', 'NORMAL', 'ANALYTICS', 'EXTERNAL'),
('inventory', 'Controle de Estoque', 'Entrada, saída e balanço de mercadorias.', 'Box', 'OPERATIONAL', '/module/inventory', 'NORMAL', 'OPERATIONAL', 'INTERNAL'),
('logistics', 'Logística e Frota', 'Gestão de entregas e manutenção de veículos.', 'Truck', 'OPERATIONAL', '/module/logistics', 'CRITICAL', 'OPERATIONAL', 'INTERNAL'),
('support-tickets', 'Central de Chamados', 'Atendimento interno e externo.', 'LifeBuoy', 'OPERATIONAL', '/module/support', 'NORMAL', 'OPERATIONAL', 'INTERNAL')
ON CONFLICT (id) DO NOTHING;

-- 5. Configuração Padrão HydroSys
INSERT INTO public.hydro_settings (id, validade_certificado_meses, validade_filtro_meses, validade_limpeza_meses, cloro_min, cloro_max, ph_min, ph_max)
VALUES ('default', 6, 6, 6, 1.0, 3.0, 7.4, 7.6)
ON CONFLICT (id) DO NOTHING;

-- 6. Notification Rules
INSERT INTO public.notification_rules (id, module_id, name, description, warning_days, critical_days, enabled) VALUES
('rule_cert', 'hydrosys', 'Certificados de Potabilidade', 'Monitora a data de validade dos laudos.', 30, 0, true),
('rule_filtros', 'hydrosys', 'Troca de Filtros', 'Monitora a data da próxima troca de elementos filtrantes.', 15, 0, true),
('rule_res', 'hydrosys', 'Limpeza de Reservatórios', 'Monitora datas de limpeza de Caixas e Cisternas.', 30, 7, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Dados de Exemplo HydroSys (Alguns registros)
-- Certificados
INSERT INTO public.hydro_certificados (id, sede_id, parceiro, status, semestre, data_analise, validade, empresa) VALUES
('cert-ald-vl', 'ALD', 'ALD - VL', 'VIGENTE', '2º/2025', '2025-08-22', '2026-02-18', 'Nexus Group'),
('cert-pe', 'PE', 'PE', 'VIGENTE', '2º/2025', '2025-09-26', '2026-03-25', 'Nexus Group'),
('cert-pjf', 'PJF', 'PJF', 'VENCIDO', '2º/2025', NULL, NULL, 'Nexus Group'),
('cert-dt', 'DT', 'DT', 'VIGENTE', '2º/2025', '2025-09-05', '2026-03-04', 'Nexus Group')
ON CONFLICT (id) DO NOTHING;

-- Filtros
INSERT INTO public.hydro_filtros (id, sede_id, patrimonio, bebedouro, local, data_troca, proxima_troca) VALUES
('pe-1', 'PE', '1098', 'Bebedouro', '10º ANDAR', '2025-07-07', '2026-01-01'),
('pe-2', 'PE', '1281', 'Bebedouro', '9º ANDAR', '2025-07-07', '2026-01-01')
ON CONFLICT (id) DO NOTHING;

-- Reservatórios (Exemplo de Poços)
INSERT INTO public.hydro_reservatorios (id, sede_id, tipo, local, responsavel, data_ultima_limpeza, proxima_limpeza, situacao_limpeza, data_limpeza_1, proxima_troca_filtro, situacao_filtro, refil) VALUES
('p-1', 'ALD', 'POCO', 'SUBSOLO', 'JOSY', '2024-01-24', '2026-07-09', 'DENTRO DO PRAZO', '2025-07-09', '2026-01-05', 'DENTRO DO PRAZO', '10"'),
('p-2', 'ALD', 'POCO', 'SUBSOLO', 'JOSY', '2024-01-24', '2026-07-14', 'DENTRO DO PRAZO', '2025-07-14', '2026-01-10', 'DENTRO DO PRAZO', '10"'),
('p-3', 'BN', 'POCO', 'CORREDOR (BOSQUE)', 'REBECCA', '2024-01-01', '2026-04-19', 'DENTRO DO PRAZO', '2025-04-19', '2025-10-16', 'DENTRO DO PRAZO', '20"')
ON CONFLICT (id) DO NOTHING;
\`;
