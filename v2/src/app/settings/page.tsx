'use client';

import { useState, useEffect } from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import { BentoCard } from '@/components/BentoCard';
import Link from 'next/link';

export default function SettingsPage() {
  const { household, updateState, loading } = useHousehold();
  const [names, setNames] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  // SECURITY: Redirect to home if unauthenticated
  useEffect(() => {
    if (!loading && !household) {
      window.location.href = '/';
    }
  }, [loading, household]);

  useEffect(() => {
    if (household) {
      setNames(household.names);
      setEmails(household.emails || {});
      setBudgets(household.budgets);
    }
  }, [household]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateState({ names, emails, budgets });
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

  const updateMemberEmail = (id: string, email: string) => {
    setEmails({ ...emails, [id]: email });
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
    const nextId = `u${nextIdNum}`;
    setNames({ ...names, [nextId]: `New Person ${nextIdNum}` });
    setEmails({ ...emails, [nextId]: '' });
  };

  if (loading || !household) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Settings...</div>;

  return (
    <main style={{ padding: '24px', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ maxWidth: 1000, margin: '0 auto', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Settings</h1>
        <Link href="/" className="btn btn-secondary">← Back to Dashboard</Link>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto' }} className="bento-grid">
        
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
        <BentoCard colSpan={12} title="Family Members">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Link family members to their Google accounts for instant access.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(names).map(([id, name], index) => (
              <div 
                key={id} 
                style={{ 
                  display: 'flex', 
                  gap: 16, 
                  alignItems: 'center', 
                  padding: '16px', 
                  borderRadius: 12, 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Human ID Circle */}
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: 'var(--bg-secondary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  {id.replace('u', '')}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Display Name</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => updateMemberName(id, e.target.value)}
                        placeholder="e.g. Nikhil"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', fontSize: 14 }}
                      />
                    </div>
                    <div style={{ flex: '1.5 1 240px' }}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Google Email</label>
                      <input 
                        type="email" 
                        value={emails[id] || ''} 
                        onChange={(e) => updateMemberEmail(id, e.target.value)}
                        placeholder="name@gmail.com"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', fontSize: 14 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addMember} 
            className="btn btn-secondary" 
            style={{ marginTop: 20, width: '100%', padding: '12px', fontSize: 13, borderStyle: 'dashed' }}
          >
            + Add Another Member
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
        <BentoCard colSpan={12}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '12px 32px' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </BentoCard>

      </div>
    </main>
  );
}
