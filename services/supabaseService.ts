
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DeviationRecord } from '../types';

/** 
 * Configuração do Banco de Dados
 */
const supabaseUrl = 'https://tlqinhgdveqlbovttwdy.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_cPWj2-GiAqD4nkGH7zcTIw_goAKr9ry';

// Verifica se as chaves foram devidamente preenchidas e são válidas
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('COLE_AQUI');

export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- Autenticação ---

export const signIn = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase não configurado corretamente no arquivo services/supabaseService.ts.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChange = (callback: (session: any) => void) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
};

// --- Dados ---

export const fetchDeviations = async (): Promise<DeviationRecord[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('deviations')
    .select('*')
    .order('DATA', { ascending: false });

  if (error) {
    console.error('Erro ao buscar desvios:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    isValid: true
  }));
};

export const upsertDeviations = async (records: DeviationRecord[]) => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const dataToUpload = records.map(({ isValid, ...rest }) => rest);

  const { data, error } = await supabase
    .from('deviations')
    .upsert(dataToUpload, { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar desvios:', error);
    throw error;
  }

  return data;
};

export const deleteDeviation = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('deviations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar desvio:', error);
    throw error;
  }
};
