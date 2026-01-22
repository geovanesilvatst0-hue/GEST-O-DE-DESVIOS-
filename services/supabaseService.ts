
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DeviationRecord } from '../types';

/** 
 * Configuração do Banco de Dados
 */
const supabaseUrl = 'https://tlqinhgdveqlbovttwdy.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_cPWj2-GiAqD4nkGH7zcTIw_goAKr9ry';

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
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.auth.signUp({ email, password });
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

  if (error) throw error;
  return (data || []).map(item => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    isValid: true
  }));
};

export const upsertDeviations = async (records: DeviationRecord[]) => {
  if (!supabase) throw new Error("Supabase não configurado.");
  
  // Removemos campos calculados ou temporários que não existem na tabela SQL
  const dataToUpload = records.map(({ isValid, ...rest }) => ({
    ...rest,
    // Garantir que a data esteja no formato YYYY-MM-DD para o Postgres
    DATA: rest.DATA ? new Date(rest.DATA).toISOString().split('T')[0] : null
  }));

  const { data, error } = await supabase
    .from('deviations')
    .upsert(dataToUpload, { onConflict: 'id' });

  if (error) {
    console.error('Erro detalhado do Supabase:', error);
    throw error;
  }

  return data;
};

export const deleteDeviation = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('deviations').delete().eq('id', id);
  if (error) throw error;
};
