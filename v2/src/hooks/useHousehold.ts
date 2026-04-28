'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppState {
  household_id: string;
  handle: string;
  names: Record<string, string>;
  income: Record<string, number>;
  budgets: Record<string, number>;
  memory: Record<string, string>;
}

export function useHousehold() {
  const [session, setSession] = useState<any>(null);
  const [household, setHousehold] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchHouseholdState();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchHouseholdState();
      else setHousehold(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHouseholdState = async () => {
    try {
      // Get app_user mapping
      const { data: userMapping } = await supabase
        .from('app_users')
        .select('household_id')
        .single();
      
      if (!userMapping?.household_id) return;
      
      const hid = userMapping.household_id;

      // Get Handle
      const { data: house } = await supabase
        .from('households')
        .select('handle')
        .eq('id', hid)
        .single();

      // Get State
      const { data: state } = await supabase
        .from('app_state')
        .select('*')
        .eq('id', hid)
        .single();

      setHousehold({
        household_id: hid,
        handle: house?.handle || '',
        names: state?.names || {},
        income: state?.income || {},
        budgets: state?.budgets || {},
        memory: state?.memory || {}
      });
    } catch (e) {
      console.error('Error fetching household state:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (updates: Partial<AppState>) => {
    if (!household?.household_id) return;
    
    const config = {
      names: updates.names || household.names,
      income: updates.income || household.income,
      budgets: updates.budgets || household.budgets,
      memory: updates.memory || household.memory
    };

    const { error } = await supabase
      .from('app_state')
      .update({ config })
      .eq('id', household.household_id);

    if (error) throw error;
    setHousehold({ ...household, ...updates });
  };

  return { session, household, loading, fetchHouseholdState, updateState };
}
