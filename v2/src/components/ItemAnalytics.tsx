'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BentoCard } from './BentoCard';

interface AggregatedItem {
  name: string;
  total_amount: number;
  count: number;
}

export function ItemAnalytics({ householdId }: { householdId: string | undefined }) {
  const [items, setItems] = useState<AggregatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (householdId) {
      fetchTopItems();
    }
  }, [householdId]);

  async function fetchTopItems() {
    setLoading(true);
    try {
      // Fetch and aggregate items manually (since Supabase RLS is enabled)
      const { data, error } = await supabase
        .from('receipt_items')
        .select('name, amount')
        .eq('household_id', householdId);

      if (error) throw error;

      // Group and aggregate
      const aggregated = (data || []).reduce((acc: Record<string, AggregatedItem>, curr) => {
        const name = curr.name.trim().toUpperCase();
        if (!acc[name]) {
          acc[name] = { name: curr.name, total_amount: 0, count: 0 };
        }
        acc[name].total_amount += Number(curr.amount);
        acc[name].count += 1;
        return acc;
      }, {});

      const sorted = Object.values(aggregated)
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 5);

      setItems(sorted);
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading analytics...</div>;

  if (items.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        No item data yet. Scan a receipt to see insights!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.count} purchases</span>
          </div>
          <span style={{ fontWeight: 600 }}>€{item.total_amount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
