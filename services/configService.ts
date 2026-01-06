import { NotificationRule } from '../types';

const RULES_KEY = 'nexus_notif_rules';

const DEFAULT_RULES: NotificationRule[] = [
  {
    id: 'rule_cert',
    moduleId: 'hydrosys',
    name: 'Certificados de Potabilidade',
    description: 'Monitora a data de validade dos laudos.',
    warningDays: 30, // Avisar com 30 dias
    criticalDays: 0, // Crítico quando vencer (0 dias restantes)
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
  getNotificationRules: (): NotificationRule[] => {
    const stored = localStorage.getItem(RULES_KEY);
    if (!stored) {
      localStorage.setItem(RULES_KEY, JSON.stringify(DEFAULT_RULES));
      return DEFAULT_RULES;
    }
    return JSON.parse(stored);
  },

  saveRule: (updatedRule: NotificationRule) => {
    const rules = configService.getNotificationRules();
    const index = rules.findIndex(r => r.id === updatedRule.id);
    if (index >= 0) {
      rules[index] = updatedRule;
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    }
  },

  resetDefaults: () => {
    localStorage.setItem(RULES_KEY, JSON.stringify(DEFAULT_RULES));
    return DEFAULT_RULES;
  }
};