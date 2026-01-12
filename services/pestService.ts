
import { PestControlEntry, PestControlSettings, User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logService } from './logService';
import { authService } from './authService';
import { notificationService } from './notificationService';

const excelToISO = (serial: number) => {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
};

const MOCK_PEST_ENTRIES: PestControlEntry[] = [
    { id: 'ald-1', sedeId: 'ALD', item: 'Dedetização', target: "Rato / Roedores", product: 'Racumin', frequency: 'Quinzenal', method: 'Isca nas caixas de passagem', technician: 'Fabio', scheduledDate: excelToISO(45906), performedDate: excelToISO(46006), observation: '', status: 'REALIZADO' },
    { id: 'ald-2', sedeId: 'ALD', item: 'Dedetização', target: "Rato / Roedores", product: 'Racumin', frequency: 'Quinzenal', method: 'Isca nas caixas de passagem', technician: 'Fabio', scheduledDate: excelToISO(45922), performedDate: excelToISO(45922), observation: 'Ok', status: 'REALIZADO' },
    { id: 'ald-3', sedeId: 'ALD', item: 'Dedetização', target: "Muriçoca / Mosquitos", product: 'k-otrine', frequency: 'Semanal', method: 'Maquina de fumaça', technician: 'Fabio', scheduledDate: excelToISO(45906), performedDate: excelToISO(45906), observation: 'Ok', status: 'REALIZADO' },
    { id: 'dl-1', sedeId: 'DL', item: 'Dedetização', target: "Rato / Roedores", product: 'Racumin', frequency: 'Quinzenal', method: 'Isca com cuscuz', technician: 'BERNARDO', scheduledDate: excelToISO(45906), performedDate: excelToISO(45906), observation: 'Ok', status: 'REALIZADO' },
    { id: 'eus-1', sedeId: 'EUS', item: 'Dedetização', target: "Barata / Escorpião", product: 'K-otrine pó', frequency: 'Quinzenal', method: 'Pó nas caixas de passagem', technician: 'PAULO', scheduledDate: excelToISO(45905), performedDate: excelToISO(45905), observation: 'Ok', status: 'REALIZADO' }
];

let LOCAL_SETTINGS: PestControlSettings = {
    pestTypes: ["Rato / Roedores", "Barata / Escorpião", "Muriçoca / Mosquitos"],
    technicians: ["Fabio", "Bernardo", "Santana", "Fernando", "Chagas", "Paulo"],
    globalFrequencies: {
        "Rato / Roedores": 15,
        "Barata / Escorpião": 15,
        "Muriçoca / Mosquitos": 7
    },
    sedeFrequencies: {}
};

const mapEntryFromDB = (db: any): PestControlEntry => ({
    id: db.id,
    sedeId: db.sede_id,
    item: db.item,
    target: db.target,
    product: db.product,
    frequency: db.frequency,
    method: db.method,
    technician: db.technician,
    scheduledDate: db.scheduled_date,
    performedDate: db.performed_date,
    observation: db.observation,
    status: db.status
});

const mapEntryToDB = (app: PestControlEntry) => ({
    id: app.id,
    sede_id: app.sedeId,
    item: app.item,
    target: app.target,
    product: app.product,
    frequency: app.frequency,
    method: app.method,
    technician: app.technician,
    scheduled_date: app.scheduledDate,
    performed_date: app.performedDate,
    observation: app.observation,
    status: app.status
});

export const pestService = {
    getAll: async (user: User): Promise<PestControlEntry[]> => {
        try {
            if (!isSupabaseConfigured()) throw new Error("Mock");
            const { data, error } = await supabase.from('pest_control_entries').select('*');
            if (error) throw error;
            const mapped = (data || []).map(mapEntryFromDB);
            if (user.role === UserRole.ADMIN) return mapped;
            return mapped.filter(item => (user.sedeIds || []).includes(item.sedeId));
        } catch (e) {
            if (user.role === UserRole.ADMIN) return MOCK_PEST_ENTRIES;
            return MOCK_PEST_ENTRIES.filter(item => (user.sedeIds || []).includes(item.sedeId));
        }
    },

    getSettings: async (): Promise<PestControlSettings> => {
        try {
            if (!isSupabaseConfigured()) throw new Error("Mock");
            const { data } = await supabase.from('pest_control_settings').select('*').single();
            if (data) {
                return {
                    pestTypes: data.pest_types || [],
                    technicians: data.technicians || [],
                    globalFrequencies: data.global_frequencies || {},
                    sedeFrequencies: data.sede_frequencies || {}
                };
            }
            throw new Error("No settings");
        } catch (e) {
            return LOCAL_SETTINGS;
        }
    },

    saveSettings: async (settings: PestControlSettings) => {
        if (isSupabaseConfigured()) {
            await supabase.from('pest_control_settings').upsert({
                id: 'default',
                pest_types: settings.pestTypes,
                technicians: settings.technicians,
                global_frequencies: settings.globalFrequencies,
                sede_frequencies: settings.sedeFrequencies
            });
        } else {
            LOCAL_SETTINGS = settings;
        }
        
        const u = authService.getCurrentUser();
        if(u) logService.logAction(u, 'PESTCONTROL', 'UPDATE', 'Configurações', 'Matriz de frequências e listas atualizadas');
    },

    save: async (item: PestControlEntry) => {
        let isCompletion = false;
        
        if (item.status === 'REALIZADO' && item.performedDate) {
            isCompletion = true;
        } else {
            const sched = new Date(item.scheduledDate);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (sched < today) item.status = 'ATRASADO';
            else item.status = 'PENDENTE';
        }

        if (isSupabaseConfigured()) {
            await supabase.from('pest_control_entries').upsert(mapEntryToDB(item));
        } else {
            const idx = MOCK_PEST_ENTRIES.findIndex(e => e.id === item.id);
            if (idx >= 0) MOCK_PEST_ENTRIES[idx] = item;
            else MOCK_PEST_ENTRIES.push(item);
        }

        const u = authService.getCurrentUser();
        if(u) logService.logAction(u, 'PESTCONTROL', 'UPDATE', `${item.target}`, `Unidade: ${item.sedeId}, Status: ${item.status}`);

        // ALERTAS INSTANTÂNEOS
        if (isCompletion) {
            await pestService.generateNextTask(item);
            // Se concluído, marca notificações relacionadas como lidas imediatamente
            await notificationService.resolveAlert(item.id);
        }
        
        // Dispara atualização da UI
        if(u) {
            // Re-checa status geral (gera novas notificações ou mantém as atuais)
            await notificationService.checkSystemStatus(u);
            // Avisa o Layout para buscar tudo de novo
            notificationService.notifyRefresh();
        }
    },

    generateNextTask: async (completedItem: PestControlEntry) => {
        const settings = await pestService.getSettings();
        const target = completedItem.target;
        const sedeId = completedItem.sedeId;

        const allEntries = await pestService.getAll({ role: UserRole.ADMIN } as User); 
        const exists = allEntries.some(e => 
            e.sedeId === completedItem.sedeId && 
            e.target === completedItem.target && 
            e.status === 'PENDENTE' &&
            new Date(e.scheduledDate) > new Date(completedItem.scheduledDate)
        );
        
        if (exists) return; 

        let daysToAdd = 15;
        
        if (settings.sedeFrequencies[sedeId] && settings.sedeFrequencies[sedeId][target]) {
            daysToAdd = settings.sedeFrequencies[sedeId][target];
        } else if (settings.globalFrequencies[target]) {
            daysToAdd = settings.globalFrequencies[target];
        }

        const performedDate = new Date(completedItem.performedDate!);
        const nextDate = new Date(performedDate);
        nextDate.setDate(nextDate.getDate() + daysToAdd);

        const nextItem: PestControlEntry = {
            id: `pc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sedeId: completedItem.sedeId,
            item: completedItem.item,
            target: completedItem.target,
            product: '',
            frequency: daysToAdd === 7 ? 'Semanal' : daysToAdd === 15 ? 'Quinzenal' : daysToAdd === 30 ? 'Mensal' : `${daysToAdd} dias`,
            method: '',
            technician: completedItem.technician,
            scheduledDate: nextDate.toISOString().split('T')[0],
            status: 'PENDENTE',
            observation: ''
        };

        if (isSupabaseConfigured()) {
            await supabase.from('pest_control_entries').insert(mapEntryToDB(nextItem));
        } else {
            MOCK_PEST_ENTRIES.push(nextItem);
        }
        
        const u = authService.getCurrentUser();
        if(u) logService.logAction(u, 'PESTCONTROL', 'CREATE', `${nextItem.target} (Auto)`, `Sede: ${nextItem.sedeId}, Agendado para: ${nextItem.scheduledDate} (Ciclo: ${daysToAdd}d)`);
    },

    delete: async (id: string) => {
        if (isSupabaseConfigured()) {
            await supabase.from('pest_control_entries').delete().eq('id', id);
        } else {
            const idx = MOCK_PEST_ENTRIES.findIndex(e => e.id === id);
            if (idx >= 0) MOCK_PEST_ENTRIES.splice(idx, 1);
        }
        // Se deletado, limpa notificações e atualiza UI
        await notificationService.resolveAlert(id);
        notificationService.notifyRefresh();
    }
};
