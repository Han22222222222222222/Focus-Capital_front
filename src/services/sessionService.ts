import { supabase } from '../lib/supabase';

export interface SessionRecord {
  duration_seconds: number;
  result: 'success' | 'failure';
  distractions: number;
  fc_earned: number;
  focus_invested: number;
}

export interface SaveSessionResult {
  success: boolean;
  error?: string;
}

export async function saveSession(record: SessionRecord): Promise<SaveSessionResult> {
  try {
    const { error } = await supabase.from('session_records').insert(record);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { success: false, error: message };
  }
}

export interface SessionHistory {
  id: string;
  created_at: string;
  duration_seconds: number;
  result: 'success' | 'failure';
  distractions: number;
  fc_earned: number;
  focus_invested: number;
}

export async function fetchRecentSessions(limit = 10): Promise<{
  data: SessionHistory[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('session_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { data: [], error: message };
  }
}

export async function fetchTodaySessions(): Promise<{
  data: SessionHistory[];
  error?: string;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const { data, error } = await supabase
      .from('session_records')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: data ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { data: [], error: message };
  }
}

export async function fetchTotalFC(): Promise<{
  total: number;
  todayDelta: number;
  error?: string;
}> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const { data, error } = await supabase
      .from('session_records')
      .select('fc_earned, created_at');

    if (error) throw error;
    const rows = data ?? [];
    const total = rows.reduce((sum, r) => sum + (r.fc_earned ?? 0), 0);
    const todayDelta = rows
      .filter(r => new Date(r.created_at) >= todayStart)
      .reduce((sum, r) => sum + (r.fc_earned ?? 0), 0);
    return { total, todayDelta };
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { total: 0, todayDelta: 0, error: message };
  }
}

export async function fetchWeeklyAnalytics(): Promise<{
  data: SessionHistory[];
  error?: string;
}> {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  try {
    const { data, error } = await supabase
      .from('session_records')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: data ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return { data: [], error: message };
  }
}
