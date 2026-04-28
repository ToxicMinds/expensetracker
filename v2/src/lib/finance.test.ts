import {
  calcTotals,
  calcPerUserSpend,
  Expense
} from './finance';

describe('V2 Migration Safety & Hybrid Parity', () => {
  
  const NAMES = { u1: 'Nikhil' };

  test('Hybrid Mode: Correctly identifies Savings from both text and ID', () => {
    const mixedExpenses: Expense[] = [
      { category: 'Savings', amount: 100, date: '2026-04-01' },             // Legacy v1 data
      { category: 'Food', category_id: 'c_savings', amount: 50, date: '2026-04-02' } // Modern v2 data (even if name changed!)
    ];

    const { saved, spent } = calcTotals(mixedExpenses);
    
    // Safety Proof: Even though one is text and one is ID, they both go to 'saved'
    expect(saved).toBe(150);
    expect(spent).toBe(0);
  });

  test('User Decoupling: Correctly attributes spend when user name changes', () => {
    // Scenario: User 'u1' changed their name from 'Nikhil' to 'Nik'
    const currentNames = { u1: 'Nik' };

    const expenses: Expense[] = [
      { who: 'Nikhil', who_id: 'u1', category: 'Groceries', amount: 10, date: '2026-04-01' }, // Old name
      { who: 'Nik', who_id: 'u1', category: 'Groceries', amount: 20, date: '2026-04-02' }    // New name
    ];

    const result = calcPerUserSpend(expenses, currentNames);
    
    // Safety Proof: Since we use who_id, both expenses are attributed to u1 (Nik)
    expect(result.u1).toBe(30);
  });

  test('Backward Compatibility: Works when who_id is missing (v1 fallback)', () => {
    const currentNames = { u1: 'Nikhil' };
    const legacyOnly: Expense[] = [
      { who: 'Nikhil', amount: 50, category: 'Groceries', date: '2026-04-01' }
    ];

    const result = calcPerUserSpend(legacyOnly, currentNames);
    expect(result.u1).toBe(50);
  });
});
