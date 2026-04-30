'use client';

import { useState, useEffect } from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import { BentoCard } from '@/components/BentoCard';
import Link from 'next/link';

export default function SettingsPage() {
  const { household, updateState, loading } = useHousehold();
  const [names, setNames] = useState<Record<string, string>>({});
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (household) {
      setNames(household.names);
      setBudgets(household.budgets);
    }
  }, [household]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateState({ names, budgets });
      alert('Settings saved successfully!');
    } catch (e) {
      alert('Error saving settings: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateMemberName = (id: string, name: string) => {
    setNames({ ...names, [id]: name });
  };

  const updateBudget = (cat: string, limit: number) => {
    setBudgets({ ...budgets, [cat]: limit });
  };

  const addMember = () => {
    // Find the next available uX ID
    const currentKeys = Object.keys(names);
    let nextIdNum = 1;
    while (currentKeys.includes(`u${nextIdNum}`)) {
      nextIdNum++;
    }
    setNames({ ...names, [`u${nextIdNum}`]: `New Person ${nextIdNum}` });
  };

  if (loading || !household) return <div style={{ padding: 48, textAlign: 'center' }}>Loading Settings...</div>;

  return (
    <main style={{ padding: '24px', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Settings</h1>
        <Link href="/" className="btn btn-secondary">Back to Dashboard</Link>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        
        {/* Household Identity */}
        <BentoCard colSpan={12} title="Household Identity">
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Household Handle</label>
              <input 
                type="text" 
                value={household.handle} 
                disabled 
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Household ID (Internal)</label>
              <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{household.household_id}</code>
            </div>
          </div>
        </BentoCard>

        {/* Member Management */}
        <BentoCard colSpan={6} title="Members">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Change display names for household members. The IDs (u1, u2) remain permanent to protect history.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(names).map(([id, name]) => (
              <div key={id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', width: 30 }}>{id}</span>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => updateMemberName(id, e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                />
              </div>
            ))}
          </div>
          <button 
            onClick={addMember} 
            className="btn btn-secondary" 
            style={{ marginTop: 16, width: '100%', fontSize: 13, borderStyle: 'dashed' }}
          >
            + Add Member
          </button>
        </BentoCard>

        {/* Category & Budget Management */}
        <BentoCard colSpan={6} title="Budgets & Categories">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Set monthly limits for your expense categories.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
            {Object.entries(budgets).map(([cat, limit]) => (
              <div key={cat} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{cat}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>€</span>
                  <input 
                    type="number" 
                    value={limit} 
                    onChange={(e) => updateBudget(cat, Number(e.target.value))}
                    style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-color)', textAlign: 'right' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Bank & Integrations Placeholder */}
        <BentoCard colSpan={12} title="Integrations (Coming Soon in v2)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 8, border: '1px dashed var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🏦</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Bank Sync</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enable Banking</div>
            </div>
            <div style={{ padding: 16, borderRadius: 8, border: '1px dashed var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Calendar</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Google Calendar</div>
            </div>
            <div style={{ padding: 16, borderRadius: 8, border: '1px dashed var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Smart Rules</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto-categorization</div>
            </div>
          </div>
        </BentoCard>

        {/* Save Action */}
        <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '24px 0' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '12px 32px' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

      </div>
    </main>
  );
}
