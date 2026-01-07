
import { createClient } from '@supabase/supabase-js';

// Helper para acessar variáveis de ambiente de forma segura
const getEnv = (key: string) => {
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

// Usa variáveis de ambiente OU as chaves fornecidas como fallback
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://fkgjksidezjaqupkdyev.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrZ2prc2lkZXpqYXF1cGtkeWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzA0NTgsImV4cCI6MjA4MzMwNjQ1OH0.iqQNLpObWcMrkNnqcaTePNSdQFj7fd66Dxw8dlvpOXc';

// Debug Logs
console.log(`[Supabase Init] URL: ${supabaseUrl}`);
console.log(`[Supabase Init] Key Length: ${supabaseAnonKey?.length || 0}`);

// Verifica se o Supabase foi configurado com chaves reais
export const isSupabaseConfigured = () => {
    const isConfigured = (
        supabaseUrl && 
        supabaseUrl !== '' && 
        supabaseAnonKey && 
        supabaseAnonKey !== '' &&
        !supabaseUrl.includes('placeholder.supabase.co')
    );
    return isConfigured;
};

// Inicializa o cliente Supabase.
export const supabase = createClient(
    supabaseUrl, 
    supabaseAnonKey
);
