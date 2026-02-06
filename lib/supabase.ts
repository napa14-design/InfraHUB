
import { createClient } from '@supabase/supabase-js';

// Helper para acessar variáveis de ambiente de forma segura
const getEnv = (key: string): string => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        return (import.meta as any).env[key] || '';
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        return process.env[key] || '';
    }
    return '';
};

// Usa variáveis de ambiente OU placeholders seguros
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'public-anon-key';

// Verifica se o Supabase foi configurado com chaves reais
export const isSupabaseConfigured = () => {
    const isConfigured = (
        supabaseUrl && 
        supabaseUrl !== '' && 
        supabaseAnonKey && 
        supabaseAnonKey !== '' &&
        !supabaseUrl.includes('placeholder.supabase.co') &&
        supabaseAnonKey !== 'public-anon-key'
    );
    return isConfigured;
};

// Inicializa o cliente Supabase.
export const supabase = createClient(
    supabaseUrl, 
    supabaseAnonKey
);
