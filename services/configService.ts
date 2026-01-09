
import { NotificationRule } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_RULES } from '../constants';

const DEFAULT_RULES: NotificationRule[] = [
  {
    id: 'rule_cert',
    moduleId: 'hydrosys',
    name: 'Certificados de Potabilidade',
    description: 'Monitora a data de validade dos laudos.',
    warningDays: 30,
    criticalDays: 0,
    enabled: true
  },
  {
    id: 'rule_filtros',
    moduleId: 'hydrosys',
    name: 'Troca de Filtros',
    description: 'Monitora a data da próxima troca de elementos filtrantes.',
    warningDays: 15,
    criticalDays: 0,
    enabled: true
  },
  {
    id: 'rule_res',
    moduleId: 'hydrosys',
    name: 'Limpeza de Reservatórios',
    description: 'Monitora datas de limpeza de Caixas e Cisternas.',
    warningDays: 30,
    criticalDays: 7,
    enabled: true
  },
  {
    id: 'rule_pest',
    moduleId: 'pestcontrol',
    name: 'Controle de Pragas',
    description: 'Monitora agendamentos de dedetização e iscagem.',
    warningDays: 5,
    criticalDays: 0,
    enabled: true
  }
];

export const configService = {
  getNotificationRules: async (): Promise<NotificationRule[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data, error } = await supabase.from('notification_rules').select('*');
        
        if (error) {
            console.error("Error fetching rules:", error);
            throw error;
        }

        if (data && data.length > 0) {
            // Map DB snake_case to App camelCase
            return data.map((r: any) => ({
                id: r.id,
                moduleId: r.module_id, // snake_case from DB
                name: r.name,
                description: r.description,
                warningDays: r.warning_days, // snake_case from DB
                criticalDays: r.critical_days, // snake_case from DB
                enabled: r.enabled
            }));
        }
        
        // If connected but empty, return defaults (and maybe save them later or let user save)
        return DEFAULT_RULES;
    } catch (e) {
        console.warn("Using Mock Rules due to error or offline mode.");
        return MOCK_RULES || DEFAULT_RULES;
    }
  },

  saveRule: async (updatedRule: NotificationRule) => {
    if (isSupabaseConfigured()) {
        // Map App camelCase to DB snake_case
        const dbPayload = {
            id: updatedRule.id,
            module_id: updatedRule.moduleId,
            name: updatedRule.name,
            description: updatedRule.description,
            warning_days: updatedRule.warningDays,
            critical_days: updatedRule.criticalDays,
            enabled: updatedRule.enabled
        };

        const { error } = await supabase.from('notification_rules').upsert(dbPayload);
        
        if (error) {
            console.error("Error saving rule:", error);
            // Return valid string error message
            return { error: error.message || JSON.stringify(error) };
        }
        return { error: null };
    }
    return { error: null };
  },

  resetDefaults: async () => {
    if (isSupabaseConfigured()) {
        for (const rule of DEFAULT_RULES) {
            const dbPayload = {
                id: rule.id,
                module_id: rule.moduleId,
                name: rule.name,
                description: rule.description,
                warning_days: rule.warningDays,
                critical_days: rule.criticalDays,
                enabled: rule.enabled
            };
            await supabase.from('notification_rules').upsert(dbPayload);
        }
    }
    return DEFAULT_RULES;
  }
};
