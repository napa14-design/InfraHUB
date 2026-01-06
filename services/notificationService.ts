import { AppNotification, NotificationType, User, UserRole } from '../types';
import { hydroService } from './hydroService';
import { configService } from './configService';
import { orgService } from './orgService';

const STORAGE_KEY = 'nexus_notifications';

export const notificationService = {
  getAll: (): AppNotification[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  add: (notification: AppNotification) => {
    const current = notificationService.getAll();
    // Avoid duplicates based on Title and Message
    const exists = current.find(n => n.title === notification.title && n.message === notification.message && !n.read);
    
    if (exists) return current;

    const updated = [notification, ...current].slice(0, 100); // Limit to 100
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  markAsRead: (id: string) => {
    const current = notificationService.getAll();
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  markAllRead: () => {
    const current = notificationService.getAll();
    const updated = current.map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // MAIN LOGIC: Checks system data against Configured Rules
  checkSystemStatus: (user: User) => {
    // Only Admins and Gestors receive these system alerts
    if (user.role === UserRole.OPERATIONAL) return;

    const rules = configService.getNotificationRules();
    const today = new Date();

    // Helper to calc days diff
    const getDiffDays = (dateStr: string) => {
        if (!dateStr) return 999;
        const target = new Date(dateStr);
        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // 1. Check HydroSys Certificates
    const certRule = rules.find(r => r.id === 'rule_cert');
    if (certRule && certRule.enabled) {
        const certs = hydroService.getCertificados(user); // Automatically filters by Sede for Gestor
        certs.forEach(cert => {
            const days = getDiffDays(cert.validade);
            const sedeName = orgService.getSedeById(cert.sedeId)?.name || 'Unidade';

            if (days <= certRule.criticalDays) {
                notificationService.add({
                    id: `cert-crit-${cert.id}`,
                    title: 'Certificado Vencido/Crítico',
                    message: `O certificado de ${cert.parceiro} em ${sedeName} expirou ou vence hoje!`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/certificados'
                });
            } else if (days <= certRule.warningDays) {
                notificationService.add({
                    id: `cert-warn-${cert.id}`,
                    title: 'Certificado a Vencer',
                    message: `O certificado de ${cert.parceiro} em ${sedeName} vence em ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/certificados'
                });
            }
        });
    }

    // 2. Check HydroSys Filters
    const filtroRule = rules.find(r => r.id === 'rule_filtros');
    if (filtroRule && filtroRule.enabled) {
        const filtros = hydroService.getFiltros(user);
        filtros.forEach(filtro => {
            const days = getDiffDays(filtro.proximaTroca);
            const sedeName = orgService.getSedeById(filtro.sedeId)?.name || 'Unidade';
            
            if (days <= filtroRule.criticalDays) {
                notificationService.add({
                    id: `filt-crit-${filtro.id}`,
                    title: 'Troca de Filtro Atrasada',
                    message: `Filtro ${filtro.patrimonio} (${filtro.local}) em ${sedeName} precisa de troca imediata.`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/filtros'
                });
            } else if (days <= filtroRule.warningDays) {
                notificationService.add({
                    id: `filt-warn-${filtro.id}`,
                    title: 'Troca de Filtro Próxima',
                    message: `Filtro ${filtro.patrimonio} vence em ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/filtros'
                });
            }
        });
    }

    // 3. Check Reservoirs (Pocos only for example)
    const resRule = rules.find(r => r.id === 'rule_res');
    if (resRule && resRule.enabled) {
        const pocos = hydroService.getPocos(user);
        pocos.forEach(poco => {
            const days = getDiffDays(poco.previsaoLimpeza1_2026); // Using example field
            const sedeName = orgService.getSedeById(poco.sedeId)?.name || 'Unidade';

            if (days <= resRule.criticalDays) {
                notificationService.add({
                    id: `res-crit-${poco.id}`,
                    title: 'Limpeza de Reservatório',
                    message: `Limpeza do Poço (${poco.local}) em ${sedeName} está atrasada ou crítica.`,
                    type: 'ERROR',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/reservatorios'
                });
            } else if (days <= resRule.warningDays) {
                 notificationService.add({
                    id: `res-warn-${poco.id}`,
                    title: 'Limpeza Próxima',
                    message: `Limpeza do Poço (${poco.local}) agendada para ${days} dias.`,
                    type: 'WARNING',
                    read: false,
                    timestamp: new Date(),
                    link: '/module/hydrosys/reservatorios'
                });
            }
        });
    }
  },

  // Simulates receiving a notification from a socket (Keep for demo purposes of other types)
  simulateIncoming: (): AppNotification => {
    return {
      id: Date.now().toString(),
      title: 'Atualização de Sistema',
      message: 'Nova versão do Nexus Hub disponível.',
      type: 'INFO',
      read: false,
      timestamp: new Date()
    };
  }
};