
import { AppNotification, NotificationType, User, UserRole } from '../types';
import { hydroService } from './hydroService';
import { configService } from './configService';
import { orgService } from './orgService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const notificationService = {
  getAll: async (): Promise<AppNotification[]> => {
    try {
        if (!isSupabaseConfigured()) throw new Error("Mock");
        const { data } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(100);
        return (data as any[])?.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
        })) || [];
    } catch (e) {
        return []; // Return empty if offline/mock
    }
  },

  add: async (notification: AppNotification) => {
    if (isSupabaseConfigured()) {
        const { error } = await supabase.from('notifications').upsert({
            ...notification,
            timestamp: notification.timestamp.toISOString()
        });
        if (error) console.error("Erro ao criar notificação", error);
    }
  },

  markAsRead: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('notifications').update({ read: true }).eq('id', id);
  },

  markAllRead: async () => {
    if (isSupabaseConfigured()) await supabase.from('notifications').update({ read: true }).neq('read', true);
  },

  // Lógica Principal de Verificação (Agora Assíncrona)
  checkSystemStatus: async (user: User) => {
    if (user.role === UserRole.OPERATIONAL) return;

    const rules = await configService.getNotificationRules();
    const today = new Date();

    const getDiffDays = (dateStr: string) => {
        if (!dateStr) return 999;
        const target = new Date(dateStr);
        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // 1. HydroSys Certificates
    const certRule = rules.find(r => r.id === 'rule_cert');
    if (certRule && certRule.enabled) {
        const certs = await hydroService.getCertificados(user);
        for (const cert of certs) {
            const days = getDiffDays(cert.validade);
            const sedeName = orgService.getSedeById(cert.sedeId)?.name || 'Unidade';
            
            // Usamos ID determinístico para upsert evitar spam
            if (days <= certRule.criticalDays) {
                await notificationService.add({
                    id: `cert-crit-${cert.id}`,
                    title: 'Certificado Vencido/Crítico',
                    message: `O certificado de ${cert.parceiro} em ${sedeName} expirou ou vence hoje!`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/certificados'
                });
            } else if (days <= certRule.warningDays) {
                await notificationService.add({
                    id: `cert-warn-${cert.id}`,
                    title: 'Certificado a Vencer',
                    message: `O certificado de ${cert.parceiro} em ${sedeName} vence em ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/certificados'
                });
            }
        }
    }

    // 2. Filtros
    const filtroRule = rules.find(r => r.id === 'rule_filtros');
    if (filtroRule && filtroRule.enabled) {
        const filtros = await hydroService.getFiltros(user);
        for (const filtro of filtros) {
            const days = getDiffDays(filtro.proximaTroca);
            const sedeName = orgService.getSedeById(filtro.sedeId)?.name || 'Unidade';
            
            if (days <= filtroRule.criticalDays) {
                await notificationService.add({
                    id: `filt-crit-${filtro.id}`,
                    title: 'Troca de Filtro Atrasada',
                    message: `Filtro ${filtro.patrimonio} (${filtro.local}) em ${sedeName} precisa de troca imediata.`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/filtros'
                });
            } else if (days <= filtroRule.warningDays) {
                await notificationService.add({
                    id: `filt-warn-${filtro.id}`,
                    title: 'Troca de Filtro Próxima',
                    message: `Filtro ${filtro.patrimonio} vence em ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/filtros'
                });
            }
        }
    }

    // 3. Reservatórios
    const resRule = rules.find(r => r.id === 'rule_res');
    if (resRule && resRule.enabled) {
        const pocos = await hydroService.getPocos(user);
        for (const poco of pocos) {
            const days = getDiffDays(poco.proximaLimpeza);
            const sedeName = orgService.getSedeById(poco.sedeId)?.name || 'Unidade';

            if (days <= resRule.criticalDays) {
                await notificationService.add({
                    id: `res-crit-${poco.id}`,
                    title: 'Limpeza de Reservatório',
                    message: `Limpeza do Poço (${poco.local}) em ${sedeName} está atrasada ou crítica.`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/reservatorios'
                });
            } else if (days <= resRule.warningDays) {
                await notificationService.add({
                    id: `res-warn-${poco.id}`,
                    title: 'Limpeza Próxima',
                    message: `Limpeza do Poço (${poco.local}) agendada para ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/reservatorios'
                });
            }
        }
    }
  }
};
