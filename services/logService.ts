
import { LogEntry, LogActionType, User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Mock Data Storage
const MOCK_LOGS: LogEntry[] = [
    { id: 'l1', userId: '1', userName: 'Roberto Admin', userRole: 'ADMIN', module: 'AUTH', action: 'LOGIN', target: 'Sistema', timestamp: new Date(Date.now() - 10000000).toISOString(), details: 'Login realizado com sucesso' },
    { id: 'l2', userId: '2', userName: 'Glória Gestora', userRole: 'GESTOR', module: 'HYDROSYS', action: 'CREATE', target: 'Certificado DT', timestamp: new Date(Date.now() - 5000000).toISOString(), details: 'Novo certificado adicionado' },
    { id: 'l3', userId: '3', userName: 'João Operacional', userRole: 'OPERATIONAL', module: 'HYDROSYS', action: 'UPDATE', target: 'Cloro PQL3', timestamp: new Date(Date.now() - 2000000).toISOString(), details: 'Registro diário: CL 1.5, pH 7.2' },
];

export const logService = {
    // Buscar todos os logs (com paginação idealmente, mas aqui simplificado)
    getAll: async (): Promise<LogEntry[]> => {
        try {
            if (isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(200);
                
                if (error) {
                    // Gracefully handle missing table (Postgres code 42P01)
                    if (error.code === '42P01') {
                        console.warn("Tabela 'audit_logs' não encontrada no Supabase. Usando dados mockados. Verifique 'Setup de Banco de Dados'.");
                        return MOCK_LOGS;
                    }
                    throw error;
                }
                
                return data.map((l: any) => ({
                    id: l.id,
                    userId: l.user_id,
                    userName: l.user_name,
                    userRole: l.user_role,
                    module: l.module,
                    action: l.action as LogActionType,
                    target: l.target,
                    details: l.details,
                    timestamp: l.timestamp
                }));
            }
            return [...MOCK_LOGS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (e: any) {
            console.error("Log fetch error:", e.message || e);
            return MOCK_LOGS;
        }
    },

    // Registrar uma ação
    logAction: async (
        user: User, 
        module: string, 
        action: LogActionType, 
        target: string, 
        details?: string
    ) => {
        const entry: LogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            module,
            action,
            target,
            details: details || '',
            timestamp: new Date().toISOString()
        };

        try {
            if (isSupabaseConfigured()) {
                const { error } = await supabase.from('audit_logs').insert({
                    user_id: entry.userId,
                    user_name: entry.userName,
                    user_role: entry.userRole,
                    module: entry.module,
                    action: entry.action,
                    target: entry.target,
                    details: entry.details,
                    timestamp: entry.timestamp
                });

                if (error) {
                    // Silent fail if table doesn't exist to avoid console noise during operations
                    if (error.code !== '42P01') {
                        console.error("Failed to write log to DB:", error.message);
                    }
                }
            } else {
                MOCK_LOGS.unshift(entry);
                // Keep mock list size reasonable
                if (MOCK_LOGS.length > 200) MOCK_LOGS.pop();
            }
        } catch (e) {
            console.error("Failed to write log", e);
        }
    }
};
