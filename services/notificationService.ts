
import { AppNotification, NotificationType, User, UserRole } from '../types';
import { hydroService } from './hydroService';
import { pestService } from './pestService';
import { configService } from './configService';
import { orgService } from './orgService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logger } from '../utils/logger';
import { diffDaysFromToday } from '../utils/dateUtils';

// Evento customizado para notificar a UI
const NOTIFICATION_UPDATE_EVENT = 'nexus_notification_update';

export const notificationService = {
  // Dispara o evento para o Layout recarregar
  notifyRefresh: () => {
      window.dispatchEvent(new Event(NOTIFICATION_UPDATE_EVENT));
  },

  // método para o componente ouvir
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
        if (error) logger.error("Erro ao criar notificação", error);
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
      } catch (e) { logger.error(e); }
  },

  checkSystemStatus: async (user: User) => {
    // Operacionais não veem NOTIFICAÇÕES de sistema, apenas Gestores e Admins
    if (user.role === UserRole.OPERATIONAL) return;

    const rules = await configService.getNotificationRules();
    const today = new Date();
    today.setHours(0,0,0,0);

    const getDiffDays = (dateStr: string) => diffDaysFromToday(dateStr);

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
    // 2. HYDROSYS AGREGADO (reservatórios e Filtros)
    // ==========================================
    // Lógica para agrupar alertas por SEDE e evitar poluição (spam)
    const resRule = rules.find(r => r.id === 'rule_res');
    const filtroRule = rules.find(r => r.id === 'rule_filtros');

    if ((resRule && resRule.enabled) || (filtroRule && filtroRule.enabled)) {
        const [pocos, cist, caixas, filtros] = await Promise.all([
            hydroService.getPocos(user),
            hydroService.getCisternas(user),
            hydroService.getCaixas(user),
            hydroService.getFiltros(user)
        ]);

        const allReservatorios = [...pocos, ...cist, ...caixas];
        
        // Mapa de problemas por Sede
        // Detalhado por Tipo para mensagem clara
        type SedeIssues = { 
            pocoCrit: number, pocoWarn: number,
            cistCrit: number, cistWarn: number,
            caixaCrit: number, caixaWarn: number,
            filtCrit: number, filtWarn: number 
        };
        const issuesMap: Record<string, SedeIssues> = {};

        // Helper para inicializar map
        const getIssueObj = (sedeId: string) => {
            if (!issuesMap[sedeId]) {
                issuesMap[sedeId] = { 
                    pocoCrit: 0, pocoWarn: 0,
                    cistCrit: 0, cistWarn: 0,
                    caixaCrit: 0, caixaWarn: 0,
                    filtCrit: 0, filtWarn: 0 
                };
            }
            return issuesMap[sedeId];
        };

        // Processar reservatórios por Tipo
        if (resRule && resRule.enabled) {
            allReservatorios.forEach(item => {
                const days = getDiffDays(item.proximaLimpeza);
                const obj = getIssueObj(item.sedeId);
                const tipo = item.tipo; // POCO, CISTERNA, CAIXA

                if (days <= resRule.criticalDays) {
                    if (tipo === 'POCO') obj.pocoCrit++;
                    else if (tipo === 'CISTERNA') obj.cistCrit++;
                    else if (tipo === 'CAIXA') obj.caixaCrit++;
                } else if (days <= resRule.warningDays) {
                    if (tipo === 'POCO') obj.pocoWarn++;
                    else if (tipo === 'CISTERNA') obj.cistWarn++;
                    else if (tipo === 'CAIXA') obj.caixaWarn++;
                }
            });
        }

        // Processar Filtros
        if (filtroRule && filtroRule.enabled) {
            // Deduplicate filtros (mesma lógica do dashboard)
            const uniqueFiltros = Array.from(filtros.reduce((map, item) => {
                const key = `${item.sedeId}-${item.patrimonio}`; 
                const existing = map.get(key);
                if (!existing || new Date(item.dataTroca) > new Date(existing.dataTroca)) map.set(key, item);
                return map;
            }, new Map<string, any>()).values());

            uniqueFiltros.forEach(item => {
                const days = getDiffDays(item.proximaTroca);
                if (days <= filtroRule.criticalDays) getIssueObj(item.sedeId).filtCrit++;
                else if (days <= filtroRule.warningDays) getIssueObj(item.sedeId).filtWarn++;
            });
        }

        // GERAR NOTIFICAÇÕES AGRUPADAS DETALHADAS
        for (const [sedeId, counts] of Object.entries(issuesMap)) {
            const totalCrit = counts.pocoCrit + counts.cistCrit + counts.caixaCrit + counts.filtCrit;
            const totalWarn = counts.pocoWarn + counts.cistWarn + counts.caixaWarn + counts.filtWarn;

            if (totalCrit > 0 || totalWarn > 0) {
                // Constroi mensagem detalhada
                let parts = [];
                
                // Críticos
                if (counts.pocoCrit > 0) parts.push(`${counts.pocoCrit} poço(s) Venc.`);
                if (counts.cistCrit > 0) parts.push(`${counts.cistCrit} Cisterna(s) Venc.`);
                if (counts.caixaCrit > 0) parts.push(`${counts.caixaCrit} Caixa(s) Venc.`);
                if (counts.filtCrit > 0) parts.push(`${counts.filtCrit} Filtros Venc.`);

                // Warnings
                if (counts.pocoWarn > 0) parts.push(`${counts.pocoWarn} poço(s) Próx.`);
                if (counts.cistWarn > 0) parts.push(`${counts.cistWarn} Cisterna(s) Próx.`);
                if (counts.caixaWarn > 0) parts.push(`${counts.caixaWarn} Caixa(s) Próx.`);
                if (counts.filtWarn > 0) parts.push(`${counts.filtWarn} Filtros Próx.`);

                const message = parts.join(', ') + '.';
                const isCritical = totalCrit > 0;

                const notifId = `hydro-agg-${sedeId}`;

                await notificationService.add({
                    id: notifId,
                    title: isCritical ? `atenção crítica: ${sedeId}` : `manutenção Prevista: ${sedeId}`,
                    message: message,
                    type: isCritical ? 'ERROR' : 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: `/module/hydrosys/reservatorios?sede=${sedeId}`, // URL filtrada
                    moduleSource: 'hydrosys'
                });
            }
        }
    }

    // ==========================================
    // 3. PEST CONTROL (Individual com lógica de pragas)
    // ==========================================
    const pestEntries = await pestService.getAll(user);
    
    const rodentRule = rules.find(r => r.id === 'rule_pest_rodents');
    const insectRule = rules.find(r => r.id === 'rule_pest_insects');
    const vectorRule = rules.find(r => r.id === 'rule_pest_vector');
    const generalRule = rules.find(r => r.id === 'rule_pest_general') || rules.find(r => r.id === 'rule_pest'); 

    for (const entry of pestEntries) {
        if (entry.status === 'REALIZADO' || entry.performedDate) continue; 

        let activeRule = generalRule;
        const targetLower = entry.target.toLowerCase();
        
        if (targetLower.includes('rato') || targetLower.includes('roedor')) activeRule = rodentRule;
        else if (targetLower.includes('mosquito') || targetLower.includes('muriçoca') || targetLower.includes('vetor')) activeRule = vectorRule;
        else if (targetLower.includes('barata') || targetLower.includes('formiga') || targetLower.includes('escorpião')) activeRule = insectRule;

        if (!activeRule || !activeRule.enabled) continue;

        const days = getDiffDays(entry.scheduledDate);
        const link = '/module/pestcontrol/execution';
        
        if (days < 0) {
            await notificationService.add({
                id: `pest-crit-${entry.id}`,
                title: 'Dedetização Atrasada',
                message: `serviço de ${entry.target} em ${entry.sedeId} está atrasado (${Math.abs(days)} dias).`,
                type: 'ERROR',
                read: false,
                timestamp: new Date(),
                link,
                moduleSource: 'pestcontrol'
            });
        } else if (days <= activeRule.warningDays) {
            await notificationService.add({
                id: `pest-warn-${entry.id}`,
                title: 'Dedetização próxima',
                message: `serviço de ${entry.target} em ${entry.sedeId} agendado para ${days === 0 ? 'hoje' : 'daqui a ' + days + ' dias'}.`,
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
