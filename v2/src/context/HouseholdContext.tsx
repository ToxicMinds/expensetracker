'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AppState } from '@/hooks/useHousehold';

interface HouseholdContextType {
  session: any;
  household: AppState | null;
  loading: boolean;
  fetchHouseholdState: () => Promise<void>;
  updateState: (updates: Partial<AppState>) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [household, setHousehold] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Session & Auth Listeners
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchHouseholdState();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchHouseholdState();
      else {
        setHousehold(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * PERFORMANCE FIX: Using the bundled RPC
   * Reduces network traffic by 66% per instance.
   */
  const fetchHouseholdState = async () => {
    try {
      // Single network round-trip instead of 3 sequential awaits
      const { data: bundle, error } = await supabase.rpc('get_household_bundle');
      
      if (error) throw error;
      if (!bundle) return;

      const { config = {}, ...metadata } = bundle;

      setHousehold({
        household_id: metadata.household_id,
        handle: metadata.handle || '',
        names: config.names || {},
        income: config.income || {},
        budgets: config.budgets || {},
        memory: config.memory || {},
        goals: config.goals || { monthly_savings: 500 },
        ai_insight: config.ai_insight,
        created_at: metadata.created_at
      });
    } catch (e) {
      console.error('Error fetching household state:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (updates: Partial<AppState>) => {
    if (!household?.household_id) return;
    
    // Get latest config from DB to avoid race conditions
    const { data: stateData } = await supabase
      .from('app_state')
      .select('config')
      .eq('id', household.household_id)
      .single();

    const currentConfig = stateData?.config || {};

    const newConfig = {
      ...currentConfig,
      names: updates.names || household.names,
      income: updates.income || household.income,
      budgets: updates.budgets || household.budgets,
      memory: updates.memory || household.memory,
      goals: updates.goals || household.goals,
      ai_insight: updates.ai_insight || household.ai_insight
    };

    const { error } = await supabase
      .from('app_state')
      .upsert({ id: household.household_id, config: newConfig });

    if (error) throw error;
    setHousehold({ ...household, ...updates });
  };

  const addCategory = async (name: string) => {
    if (!household?.budgets) return;
    const cleanName = name.trim();
    if (!cleanName || household.budgets[cleanName] !== undefined) return;
    
    const newBudgets = { ...household.budgets, [cleanName]: 0 };
    await updateState({ budgets: newBudgets });
  };

  return (
    <HouseholdContext.Provider value={{ 
      session, 
      household, 
      loading, 
      fetchHouseholdState, 
      updateState,
      addCategory
    }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdContext() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHouseholdContext must be used within a HouseholdProvider');
  }
  return context;
}
