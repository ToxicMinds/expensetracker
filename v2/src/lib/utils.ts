import { supabase } from './supabase';

/**
 * Executes a fetch request with exponential backoff retries.
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 500): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0 && response.status >= 500) {
      console.warn(`Fetch failed (${response.status}), retrying in ${backoff}ms...`);
      await new Promise(res => setTimeout(res, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch threw error, retrying in ${backoff}ms...`, error);
      await new Promise(res => setTimeout(res, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

/**
 * Logs system errors to the Supabase audit_logs table for free backend monitoring.
 */
export async function systemLog(action: string, errorData: any, householdId?: string) {
  try {
    await supabase.from('audit_logs').insert({
      table_name: 'system',
      record_id: 'error',
      action: action,
      new_data: { error: errorData?.message || errorData, stack: errorData?.stack },
      household_id: householdId || null
    });
  } catch (e) {
    console.error('Failed to write system log:', e);
  }
}
