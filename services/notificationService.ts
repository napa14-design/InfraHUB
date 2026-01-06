import { AppNotification, NotificationType } from '../types';

const STORAGE_KEY = 'nexus_notifications';

// Helper to generate fake notifications for demo
const MESSAGES = [
  { title: 'Novo Chamado', msg: 'Um chamado de alta prioridade foi aberto.', type: 'WARNING' },
  { title: 'Meta Batida!', msg: 'A equipe de vendas atingiu 100% da meta mensal.', type: 'SUCCESS' },
  { title: 'Manutenção', msg: 'O sistema passará por manutenção às 23h.', type: 'INFO' },
  { title: 'Erro de Sincronia', msg: 'Falha ao conectar com API de Logística.', type: 'ERROR' }
];

export const notificationService = {
  getAll: (): AppNotification[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  add: (notification: AppNotification) => {
    const current = notificationService.getAll();
    const updated = [notification, ...current].slice(0, 50); // Limit to 50
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

  // Simulates receiving a notification from a socket
  simulateIncoming: (): AppNotification => {
    const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    return {
      id: Date.now().toString(),
      title: randomMsg.title,
      message: randomMsg.msg,
      type: randomMsg.type as NotificationType,
      read: false,
      timestamp: new Date()
    };
  }
};