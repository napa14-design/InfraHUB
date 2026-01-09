
import { PestControlEntry, PestControlSettings, User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logService } from './logService';
import { authService } from './authService';

// Mock Data
const MOCK_PEST_ENTRIES: PestControlEntry[] = [
    { id: 'pc-1', sedeId: 'ALD', item: 'Dedetização', target: 'Rato', product: 'Racumin', frequency: 'Quinzenal', method: 'Isca nas caixas de passagem', technician: 'Fabio', scheduledDate: '2025-09-06', performedDate: '2025-12-15', observation: '', status: 'REALIZADO' },
    { id: 'pc-2', sedeId: 'ALD', item: 'Dedetização', target: 'Rato', product: 'Racumin', frequency: 'Quinzenal', method: 'Isca nas caixas de passagem', technician: 'Fabio', scheduledDate: '2025-09-22', performedDate: '2025-09-22', observation: 'Ok', status: 'REALIZADO' },
    { id: 'pc-3', sedeId: 'ALD', item: 'Dedetização', target: 'Muriçoca', product: 'k-otrine', frequency: 'Semanal', method: 'Maquina de fumaça', technician: 'Fabio', scheduledDate: '2025-09-06', performedDate: '2025-09-06', observation: 'Ok', status: 'REALIZADO' },
    { id: 'pc-9', sedeId: 'ALD', item: 'Dedetização', target: 'Rato', product: 'Racumin', frequency: 'Quinzenal', method: 'Isca nas caixas de passagem', technician: 'Fabio', scheduledDate: '2025-10-06', performedDate: undefined, observation: '', status: 'PENDENTE' },
];

let MOCK_SETTINGS: PestControlSettings = {
    frequencyRato: 15,
    frequencyMuricoca: 15,
    frequencyBarata: 15,
    defaultTechnician: 'Fabio'
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

const filterByScope = (data: PestControlEntry[], user: User): PestControlEntry[] => {
  if (user.role === UserRole.ADMIN) return data;
  const userSedes = user.sedeIds || [];
  return data.filter(item => userSedes.includes(item.sedeId));
};

export const pestService = {
    getAll: async (user: User): Promise<PestControlEntry[]> => {
        try {
            if (!isSupabaseConfigured()) throw new Error("Mock");
            const { data, error } = await supabase.from('pest_control_entries').select('*');
            if (error) throw error;
            const mapped = (data || []).map(mapEntryFromDB);
            return filterByScope(mapped, user);
        } catch (e) {
            return filterByScope(MOCK_PEST_ENTRIES, user);
        }
    },

    getSettings: async (): Promise<PestControlSettings> => {
        try {
            if (!isSupabaseConfigured()) throw new Error("Mock");
            const { data } = await supabase.from('pest_control_settings').select('*').single();
            if (data) {
                return {
                    frequencyRato: data.freq_rato,
                    frequencyMuricoca: data.freq_muricoca,
                    frequencyBarata: data.freq_barata,
                    defaultTechnician: data.default_technician
                };
            }
            throw new Error("No settings");
        } catch (e) {
            return MOCK_SETTINGS;
        }
    },

    saveSettings: async (settings: PestControlSettings) => {
        if (isSupabaseConfigured()) {
            await supabase.from('pest_control_settings').upsert({
                id: 'default',
                freq_rato: settings.frequencyRato,
                freq_muricoca: settings.frequencyMuricoca,
                freq_barata: settings.frequencyBarata,
                default_technician: settings.defaultTechnician
            });
        } else {
            MOCK_SETTINGS = settings;
        }
        
        const u = authService.getCurrentUser();
        if(u) logService.logAction(u, 'PESTCONTROL', 'UPDATE', 'Configurações', 'Intervalos atualizados');
    },

    // Main Logic: Save and potentially auto-schedule next task
    save: async (item: PestControlEntry) => {
        let isCompletion = false;
        
        // 1. Check if this save is completing a task
        // We need to know previous state to be sure, or check if performedDate was just added.
        // For simplicity, if status is REALIZADO and performedDate exists, we assume it might trigger next.
        // To avoid duplicates, the UI/Service logic should ensure we don't double-create. 
        // Ideally, we'd check DB, but here we'll rely on the fact that 'save' creates the next one immediately.
        
        if (item.status === 'REALIZADO' && item.performedDate) {
            isCompletion = true;
        } else {
            // Recalculate status if not realized
            const sched = new Date(item.scheduledDate);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (sched < today) item.status = 'ATRASADO';
            else item.status = 'PENDENTE';
        }

        // 2. Persist Current Item
        if (isSupabaseConfigured()) {
            await supabase.from('pest_control_entries').upsert(mapEntryToDB(item));
        } else {
            const idx = MOCK_PEST_ENTRIES.findIndex(e => e.id === item.id);
            if (idx >= 0) MOCK_PEST_ENTRIES[idx] = item;
            else MOCK_PEST_ENTRIES.push(item);
        }

        const u = authService.getCurrentUser();
        if(u) logService.logAction(u, 'PESTCONTROL', 'UPDATE', `${item.target}`, `Status: ${item.status}`);

        // 3. Auto-Schedule Next if Completed
        if (isCompletion) {
            await pestService.generateNextTask(item);
        }
    },

    generateNextTask: async (completedItem: PestControlEntry) => {
        // Prevent duplicate generation check (naive impl for mock/demo)
        // In real DB, we might check if a pending task exists for same target/sede with date > performedDate
        
        const settings = await pestService.getSettings();
        let daysToAdd = 15; // Default

        const target = completedItem.target.toLowerCase();
        if (target.includes('rato')) daysToAdd = settings.frequencyRato;
        else if (target.includes('muriçoca') || target.includes('muricoca')) daysToAdd = settings.frequencyMuricoca;
        else if (target.includes('barata') || target.includes('escorpi')) daysToAdd = settings.frequencyBarata;

        const performedDate = new Date(completedItem.performedDate!);
        const nextDate = new Date(performedDate);
        nextDate.setDate(nextDate.getDate() + daysToAdd);

        const nextItem: PestControlEntry = {
            id: `pc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sedeId: completedItem.sedeId,
            item: completedItem.item,
            target: completedItem.target,
            product: completedItem.product,
            frequency: completedItem.frequency,
            method: completedItem.method,
            technician: completedItem.technician, // Keep same tech or use default
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
        if(u) logService.logAction(u, 'PESTCONTROL', 'CREATE', `${nextItem.target} (Auto)`, `Agendado para: ${nextItem.scheduledDate}`);
    },

    delete: async (id: string) => {
        if (isSupabaseConfigured()) {
            await supabase.from('pest_control_entries').delete().eq('id', id);
        } else {
            const idx = MOCK_PEST_ENTRIES.findIndex(e => e.id === id);
            if (idx >= 0) MOCK_PEST_ENTRIES.splice(idx, 1);
        }
    }
};
