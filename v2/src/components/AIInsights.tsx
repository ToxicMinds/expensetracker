'use client';

import { useState, useEffect } from 'react';
import { BentoCard } from './BentoCard';

const CACHE_KEY = 'et_ai_insight_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface InsightCache {
  insight: string;
  timestamp: number;
  expenseHash: string;
}

export function AIInsights({ householdId, expenseCount, updateState, household }: { householdId: string | undefined, expenseCount?: number, updateState?: any, household?: any }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'cache' | 'live' | 'error'>('live');

  useEffect(() => {
    if (householdId && household) fetchInsight();
  }, [householdId, expenseCount, household]);

  async function fetchInsight(forceRefresh = false) {
    if (!householdId) return;
    setLoading(true);

    const cacheHash = `${householdId}_${expenseCount ?? 0}`;
    
    // 1. Check Supabase state first
    if (!forceRefresh && household?.ai_insight?.hash === cacheHash) {
      setInsight(household.ai_insight.insight);
      setSource('cache');
      setLoading(false);
      return;
    }

    // 2. Cache miss — call the API
    try {
      const response = await fetch(`/api/ai/insight?householdId=${householdId}`);
      const data = await response.json();

      if (data.success && data.insight) {
        setInsight(data.insight);
        setSource('live');
        if (updateState) {
          updateState({ ai_insight: { insight: data.insight, hash: cacheHash } });
        }
      } else {
        const reason = data.error || 'Neo4j returned no merchants — run the sync endpoint first.';
        setInsight(`⚠️ Graph not ready: ${reason}`);
        setSource('error');
      }
    } catch (e: any) {
      setInsight(`⚠️ Could not reach the AI service: ${e.message}`);
      setSource('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <BentoCard title="AI Intelligence" colSpan={8}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56 }}>
          <div className="spinner-small" />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Querying your spending graph…</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0
          }}>
            💡
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Graph & AI Insight</p>
              {source === 'cache' && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                  cached
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {insight}
            </p>
            {(
              <button
                onClick={() => fetchInsight(true)}
                style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                ↻ Refresh insight
              </button>
            )}
          </div>
        </div>
      )}
    </BentoCard>
  );
}
