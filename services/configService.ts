
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
  }
];

export const configService = {
  getNotificationRules: async (): Promise<NotificationRule[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data } = await supabase.from('notification_rules').select('*');
        if (data && data.length > 0) return data;
        return DEFAULT_RULES;
    } catch (e) {
        return MOCK_RULES || DEFAULT_RULES;
    }
  },

  saveRule: async (updatedRule: NotificationRule) => {
    if (isSupabaseConfigured()) await supabase.from('notification_rules').upsert(updatedRule);
  },

  resetDefaults: async () => {
    if (isSupabaseConfigured()) {
        for (const rule of DEFAULT_RULES) {
            await supabase.from('notification_rules').upsert(rule);
        }
    }
    return DEFAULT_RULES;
  }
};
