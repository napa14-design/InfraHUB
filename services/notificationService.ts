
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
      if (isSupabaseConfigured()) {
          // Busca IDs parecidos
          const { data } = await supabase.from('notifications').select('id').ilike('id', `%${relatedId}%`).eq('read', false);
          
          if (data && data.length > 0) {
              const ids = data.map(n => n.id);
              await supabase.from('notifications').update({ read: true }).in('id', ids);
          }
      }
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
    // Operacionais não veem notificações de sistema, apenas Gestores e Admins
    if (user.role === UserRole.OPERATIONAL) return;

    const rules = await configService.getNotificationRules();
    const today = new Date();
    today.setHours(0,0,0,0);

    const getDiffDays = (dateStr: string) => {
        if (!dateStr) return 999;
        const [year, month, day] = dateStr.split('-').map(Number);
        const target = new Date(year, month - 1, day);
        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // ==========================================
    // 1. HYDROSYS CERTIFICADOS (Individual)
    // ==========================================
    const certRule = rules.find(r => r.id === 'rule_cert');
    if (certRule && certRule.enabled) {
        const certs = await hydroService.getCertificados(user);
        // Deduplicate
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

    // ==========================================
    // 2. HYDROSYS AGREGADO (Reservatórios e Filtros)
    // ==========================================
    const resRule = rules.find(r => r.id === 'rule_res');
    const filtroRule = rules.find(r => r.id === 'rule_filtros');

    if ((resRule && resRule.enabled) || (filtroRule && filtroRule.enabled)) {
        const [pocos, cist, caixas, filtros] = await Promise.all([
            hydroService.getPocos(user),
            hydroService.getCisternas(user),
            hydroService.getCaixas(user),
            hydroService.getFiltros(user)
        ]);

        type SedeIssues = { 
            pocoCrit: number, pocoWarn: number,
            cistCrit: number, cistWarn: number,
            caixaCrit: number, caixaWarn: number,
            filtroCrit: number, filtroWarn: number
        };

        const issuesMap = new Map<string, SedeIssues>();

        const getSedeIssue = (id: string) => {
            if (!issuesMap.has(id)) {
                issuesMap.set(id, { 
                    pocoCrit: 0, pocoWarn: 0, 
                    cistCrit: 0, cistWarn: 0, 
                    caixaCrit: 0, caixaWarn: 0,
                    filtroCrit: 0, filtroWarn: 0
                });
            }
            return issuesMap.get(id)!;
        };

        // Check Reservoirs
        if (resRule && resRule.enabled) {
            pocos.forEach(p => {
                const days = getDiffDays(p.proximaLimpeza);
                const s = getSedeIssue(p.sedeId);
                if (days <= resRule.criticalDays) s.pocoCrit++;
                else if (days <= resRule.warningDays) s.pocoWarn++;
            });
            cist.forEach(c => {
                const days = getDiffDays(c.proximaLimpeza);
                const s = getSedeIssue(c.sedeId);
                if (days <= resRule.criticalDays) s.cistCrit++;
                else if (days <= resRule.warningDays) s.cistWarn++;
            });
            caixas.forEach(c => {
                const days = getDiffDays(c.proximaLimpeza);
                const s = getSedeIssue(c.sedeId);
                if (days <= resRule.criticalDays) s.caixaCrit++;
                else if (days <= resRule.warningDays) s.caixaWarn++;
            });
        }

        // Check Filtros
        if (filtroRule && filtroRule.enabled) {
            filtros.forEach(f => {
                const days = getDiffDays(f.proximaTroca);
                const s = getSedeIssue(f.sedeId);
                if (days <= filtroRule.criticalDays) s.filtroCrit++;
                else if (days <= filtroRule.warningDays) s.filtroWarn++;
            });
        }

        // Generate Notifications for HydroSys Aggregated
        for (const [sedeId, issues] of issuesMap.entries()) {
            const totalCrit = issues.pocoCrit + issues.cistCrit + issues.caixaCrit + issues.filtroCrit;
            const totalWarn = issues.pocoWarn + issues.cistWarn + issues.caixaWarn + issues.filtroWarn;

            if (totalCrit > 0) {
                await notificationService.add({
                    id: `hydro-crit-${sedeId}-${today.toISOString().split('T')[0]}`,
                    title: `Ação Necessária: ${sedeId}`,
                    message: `Existem ${totalCrit} itens vencidos ou críticos nesta unidade (Limpeza/Filtros).`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: `/module/hydrosys?sede=${sedeId}`,
                    moduleSource: 'hydrosys'
                });
            } else if (totalWarn > 0) {
                await notificationService.add({
                    id: `hydro-warn-${sedeId}-${today.toISOString().split('T')[0]}`,
                    title: `Atenção: ${sedeId}`,
                    message: `Existem ${totalWarn} manutenções programadas para breve.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: `/module/hydrosys?sede=${sedeId}`,
                    moduleSource: 'hydrosys'
                });
            }
        }
    }

    // ==========================================
    // 3. PEST CONTROL
    // ==========================================
    const pestEntries = await pestService.getAll(user);
    // Filter pending/delayed
    const activePest = pestEntries.filter(p => p.status !== 'REALIZADO');

    for (const entry of activePest) {
        // Match specific rules or fallback
        let rule = rules.find(r => r.id === 'rule_pest_general'); // Default
        const targetLower = entry.target.toLowerCase();
        
        if (targetLower.includes('rato') || targetLower.includes('roedor')) {
            rule = rules.find(r => r.id === 'rule_pest_rodents') || rule;
        } else if (targetLower.includes('barata') || targetLower.includes('inseto') || targetLower.includes('escorpi')) {
            rule = rules.find(r => r.id === 'rule_pest_insects') || rule;
        } else if (targetLower.includes('mosquito') || targetLower.includes('muriçoca') || targetLower.includes('fumacê')) {
            rule = rules.find(r => r.id === 'rule_pest_vector') || rule;
        }

        if (rule && rule.enabled) {
            const days = getDiffDays(entry.scheduledDate);
            
            if (days < 0) {
                 await notificationService.add({
                    id: `pest-crit-${entry.id}`,
                    title: 'Serviço Atrasado',
                    message: `${entry.item} (${entry.target}) em ${entry.sedeId} estava agendado para ${new Date(entry.scheduledDate).toLocaleDateString()}.`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/pestcontrol/execution',
                    moduleSource: 'pestcontrol'
                });
            } else if (days <= rule.warningDays) {
                await notificationService.add({
                    id: `pest-warn-${entry.id}`,
                    title: 'Serviço Agendado',
                    message: `${entry.item} (${entry.target}) em ${entry.sedeId} previsto para ${days === 0 ? 'HOJE' : `daqui a ${days} dias`}.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/pestcontrol/execution',
                    moduleSource: 'pestcontrol'
                });
            }
        }
    }
  }
};
