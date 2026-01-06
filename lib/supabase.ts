import { createClient } from '@supabase/supabase-js';

// Estes valores devem estar no seu arquivo .env
// Exemplo: 
// VITE_SUPABASE_URL="https://xyzcompany.supabase.co"
// VITE_SUPABASE_ANON_KEY="eyJhRg..."

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return supabaseUrl !== '' && supabaseAnonKey !== '';
};