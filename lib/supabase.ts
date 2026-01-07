
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

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Verifica se o Supabase foi configurado com chaves reais
// Se a URL estiver vazia ou for a URL de placeholder, consideramos como NÃO configurado.
export const isSupabaseConfigured = () => {
    return (
        supabaseUrl && 
        supabaseUrl !== '' && 
        supabaseAnonKey && 
        supabaseAnonKey !== '' &&
        !supabaseUrl.includes('placeholder.supabase.co')
    );
};

// Inicializa o cliente Supabase.
// Se não estiver configurado, usa placeholders para evitar crash na inicialização do módulo,
// mas os serviços devem verificar `isSupabaseConfigured()` antes de fazer chamadas de rede.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder-key'
);
