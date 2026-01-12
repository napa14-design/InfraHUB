
import { AppNotification, NotificationType, User, UserRole } from '../types';
import { hydroService } from './hydroService';
import { pestService } from './pestService';
import { configService } from './configService';
import { orgService } from './orgService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Evento customizado para notificar a UI
const NOTIFICATION_UPDATE_EVENT = 'nexus_notification_update';

export const notificationService = {
  // Dispara o evento para o Layout recarregar
  notifyRefresh: () => {
      window.dispatchEvent(new Event(NOTIFICATION_UPDATE_EVENT));
  },

  // Método para o componente ouvir
  onRefresh: (callback: () => void) => {
      window.addEventListener(NOTIFICATION_UPDATE_EVENT, callback);
      return () => window.removeEventListener(NOTIFICATION_UPDATE_EVENT, callback);
  },

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
    notificationService.notifyRefresh(); // Atualiza UI imediatamente
  },

  // Usado quando resolvemos um problema (ex: Certificado renovado)
  resolveAlert: async (relatedId: string) => {
      // Tenta marcar como lida qualquer notificação que contenha o ID do item
      // Isso cobre 'pest-crit-{id}', 'pest-warn-{id}', etc.
      if (isSupabaseConfigured()) {
          // Busca IDs parecidos
          const { data } = await supabase.from('notifications').select('id').ilike('id', `%${relatedId}%`).eq('read', false);
          
          if (data && data.length > 0) {
              const ids = data.map(n => n.id);
              await supabase.from('notifications').update({ read: true }).in('id', ids);
          }
      }
      // Não chamamos notifyRefresh aqui pois geralmente isso é chamado antes de um checkSystemStatus
  },

  markByLink: async (link: string) => {
    if (isSupabaseConfigured()) {
        await supabase.from('notifications').update({ read: true }).eq('link', link).eq('read', false);
    }
    notificationService.notifyRefresh();
  },

  markAllRead: async () => {
    if (isSupabaseConfigured()) await supabase.from('notifications').update({ read: true }).neq('read', true);
    notificationService.notifyRefresh();
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
    // Normalize today for accurate day diff calculation
    today.setHours(0,0,0,0);

    const getDiffDays = (dateStr: string) => {
        if (!dateStr) return 999;
        // Manual parse to ensure local date without timezone shifts
        const [year, month, day] = dateStr.split('-').map(Number);
        const target = new Date(year, month - 1, day);
        
        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // 1. HydroSys Certificates
    const certRule = rules.find(r => r.id === 'rule_cert');
    if (certRule && certRule.enabled) {
        const certs = await hydroService.getCertificados(user);
        
        // Deduplicate Certs (Only latest per Partner/Sede matters for alerts)
        const uniqueCerts = Array.from(certs.reduce((map, item) => {
            const key = `${item.sedeId}-${item.parceiro}`;
            const existing = map.get(key);
            if (!existing || new Date(item.validade) > new Date(existing.validade)) map.set(key, item);
            return map;
        }, new Map<string, any>()).values());

        for (const cert of uniqueCerts) {
            const days = getDiffDays(cert.validade);
            const link = '/module/hydrosys/certificados';
            
            if (days <= certRule.criticalDays) {
                await notificationService.add({
                    id: `cert-crit-${cert.id}`,
                    title: 'Certificado Vencido',
                    message: `O certificado de ${cert.parceiro} em ${cert.sedeId} expirou!`,
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
                    message: `O certificado de ${cert.parceiro} em ${cert.sedeId} vence em ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link,
                    moduleSource: 'hydrosys'
                });
            }
        }
    }

    // 2. Pest Control (Dedetização)
    const pestEntries = await pestService.getAll(user);
    
    // Find Specific Rules
    const rodentRule = rules.find(r => r.id === 'rule_pest_rodents');
    const insectRule = rules.find(r => r.id === 'rule_pest_insects');
    const vectorRule = rules.find(r => r.id === 'rule_pest_vector');
    const generalRule = rules.find(r => r.id === 'rule_pest_general') || rules.find(r => r.id === 'rule_pest'); // Fallback to old 'rule_pest' if exists

    for (const entry of pestEntries) {
        // IGNORE COMPLETED ITEMS
        if (entry.status === 'REALIZADO' || entry.performedDate) {
            continue; 
        }

        // Determine specific rule based on target string
        let activeRule = generalRule;
        const targetLower = entry.target.toLowerCase();
        
        if (targetLower.includes('rato') || targetLower.includes('roedor')) {
            activeRule = rodentRule;
        } else if (targetLower.includes('mosquito') || targetLower.includes('muriçoca') || targetLower.includes('vetor')) {
            activeRule = vectorRule;
        } else if (targetLower.includes('barata') || targetLower.includes('formiga') || targetLower.includes('escorpião')) {
            activeRule = insectRule;
        }

        // Check if rule exists and is enabled
        if (!activeRule || !activeRule.enabled) continue;

        const days = getDiffDays(entry.scheduledDate);
        const link = '/module/pestcontrol/execution';
        
        // CRITICAL: Overdue items (Negative days)
        if (days < 0) {
            await notificationService.add({
                id: `pest-crit-${entry.id}`,
                title: 'Dedetização Atrasada',
                message: `Serviço de ${entry.target} em ${entry.sedeId} está atrasado (${Math.abs(days)} dias).`,
                type: 'ERROR',
                read: false,
                timestamp: new Date(),
                link,
                moduleSource: 'pestcontrol'
            });
        } 
        // WARNING: Upcoming items within warning range
        else if (days <= activeRule.warningDays) {
            await notificationService.add({
                id: `pest-warn-${entry.id}`,
                title: 'Dedetização Próxima',
                message: `Serviço de ${entry.target} em ${entry.sedeId} agendado para ${days === 0 ? 'hoje' : 'daqui a ' + days + ' dias'}.`,
                type: 'WARNING',
                read: false,
                timestamp: new Date(),
                link,
                moduleSource: 'pestcontrol'
            });
        }
    }
  }
};
