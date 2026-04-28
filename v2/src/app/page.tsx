'use client';

import { useEffect, useState } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { UserAvatarToggle } from '@/components/UserAvatarToggle';
import { ExpenseList } from '@/components/ExpenseList';
import { useHousehold } from '@/hooks/useHousehold';
import { useExpenses, ReceiptData } from '@/hooks/useExpenses';
import { calcTotals, calcBudgetStatus } from '@/lib/finance';
import { AuthScreen } from '@/components/AuthScreen';
import { ReceiptScanner } from '@/components/ReceiptScanner';
import { ItemAnalytics } from '@/components/ItemAnalytics';
import { SpendingBreakdown, DailyTrend } from '@/components/FinanceCharts';

export default function Home() {
  const { session, household, loading: hLoading } = useHousehold();
  const { expenses, loading: eLoading, softDeleteExpense, saveReceipt } = useExpenses(household?.household_id);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Auto-select first user if none selected
  useEffect(() => {
    if (household && !selectedUser) {
      const firstId = Object.keys(household.names)[0];
      if (firstId) setSelectedUser(firstId);
    }
  }, [household, selectedUser]);

  const loading = hLoading || (household && eLoading);

  const handleSaveReceipt = async (data: ReceiptData) => {
    if (!selectedUser || !household) return;
    try {
      await saveReceipt(data, selectedUser, household.names[selectedUser]);
      setShowScanner(false);
    } catch (e) {
      alert("Failed to save receipt: " + (e as Error).message);
    }
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading System...</div>;

  if (!household) {
    return <AuthScreen session={session} />;
  }

  return (
    <main style={{ padding: '24px 0' }}>
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>ET Expense</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{household.handle}</span>
        </div>
      </header>

      <div className="bento-grid">
        {showScanner ? (
          <div style={{ gridColumn: 'span 12' }}>
            <ReceiptScanner onSave={handleSaveReceipt} />
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: 12, width: '100%' }}
              onClick={() => setShowScanner(false)}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <BentoCard colSpan={12} title="Members">
              <UserAvatarToggle 
                users={household.names} 
                selectedId={selectedUser} 
                onSelect={setSelectedUser} 
              />
            </BentoCard>

            <BentoCard colSpan={8} rowSpan={2} title="Recent Expenses">
              <ExpenseList expenses={expenses} onDelete={softDeleteExpense} />
            </BentoCard>

            <BentoCard colSpan={4} title="Overview">
              <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em' }}>
                €{calcTotals(expenses).spent.toFixed(2)}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Total Spent</p>
              <div style={{ marginTop: 24 }}>
                <DailyTrend expenses={expenses} />
              </div>
            </BentoCard>

            <BentoCard colSpan={4} title="Categories">
              <SpendingBreakdown expenses={expenses} />
            </BentoCard>

            <BentoCard colSpan={4} title="Quick Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary">Add Expense</button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    if (!selectedUser) alert("Please select a user first.");
                    else setShowScanner(true);
                  }}
                >
                  Scan Receipt
                </button>
              </div>
            </BentoCard>

            <BentoCard colSpan={12} title="Top Items (Deep Analytics)">
              <ItemAnalytics householdId={household.household_id} />
            </BentoCard>
          </>
        )}
      </div>
    </main>
  );
}
