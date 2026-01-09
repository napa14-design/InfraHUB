
import { AppNotification, NotificationType, User, UserRole } from '../types';
import { hydroService } from './hydroService';
import { pestService } from './pestService';
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
            timestamp: new Date(n.timestamp),
            moduleSource: n.module_source 
        })) || [];
    } catch (e) {
        return []; 
    }
  },

  add: async (notification: AppNotification) => {
    if (isSupabaseConfigured()) {
        const { error } = await supabase.from('notifications').upsert({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            read: notification.read,
            link: notification.link,
            module_source: notification.moduleSource,
            timestamp: notification.timestamp.toISOString()
        });
        if (error) console.error("Erro ao criar notificação", error);
    }
    if (notification.type === 'ERROR' && !notification.read) {
        notificationService.sendBrowserNotification(notification);
    }
  },

  markAsRead: async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from('notifications').update({ read: true }).eq('id', id);
  },

  markByLink: async (link: string) => {
    if (isSupabaseConfigured()) {
        await supabase.from('notifications').update({ read: true }).eq('link', link).eq('read', false);
    }
  },

  markAllRead: async () => {
    if (isSupabaseConfigured()) await supabase.from('notifications').update({ read: true }).neq('read', true);
  },

  requestPermission: async () => {
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          await Notification.requestPermission();
      }
  },

  sendBrowserNotification: (notification: AppNotification) => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      try {
          const n = new Notification(`ALERTA: ${notification.title}`, {
              body: notification.message,
              icon: '/vite.svg'
          });
          n.onclick = () => {
              window.focus();
              if (notification.link) window.location.href = `/#${notification.link}`;
          };
      } catch (e) { console.error(e); }
  },

  checkSystemStatus: async (user: User) => {
    if (user.role === UserRole.OPERATIONAL) return;

    const rules = await configService.getNotificationRules();
    const today = new Date();
    today.setHours(0,0,0,0);

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
            const link = '/module/hydrosys/certificados';
            
            if (days <= certRule.criticalDays) {
                await notificationService.add({
                    id: `cert-crit-${cert.id}`,
                    title: 'Certificado Vencido',
                    message: `O certificado de ${cert.parceiro} expirou!`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link,
                    moduleSource: 'hydrosys'
                });
            } else if (days <= certRule.warningDays) {
                await notificationService.add({
                    id: `cert-warn-${cert.id}`,
                    title: 'Certificado a Vencer',
                    message: `O certificado de ${cert.parceiro} vence em ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link,
                    moduleSource: 'hydrosys'
                });
            } else {
                // AUTO RESOLVE: Se estava em alerta e agora está OK (foi renovado)
                await notificationService.markByLink(link);
            }
        }
    }

    // 2. Pest Control (Dedetização)
    const pestRule = rules.find(r => r.id === 'rule_pest');
    if (pestRule && pestRule.enabled) {
        const pestEntries = await pestService.getAll(user);
        for (const entry of pestEntries) {
            const link = '/module/pestcontrol/execution';
            if (entry.status === 'REALIZADO') {
                // Se o item foi realizado, removemos notificações de atraso dele
                // Aqui simplificamos marcando as do link como lidas
                continue; 
            }

            const days = getDiffDays(entry.scheduledDate);
            if (days <= pestRule.criticalDays) {
                await notificationService.add({
                    id: `pest-crit-${entry.id}`,
                    title: 'Dedetização Atrasada',
                    message: `Serviço de ${entry.target} está atrasado!`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link,
                    moduleSource: 'pestcontrol'
                });
            } else if (days <= pestRule.warningDays) {
                await notificationService.add({
                    id: `pest-warn-${entry.id}`,
                    title: 'Dedetização Próxima',
                    message: `Serviço de ${entry.target} agendado para daqui a ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link,
                    moduleSource: 'pestcontrol'
                });
            }
        }
    }
  }
};
