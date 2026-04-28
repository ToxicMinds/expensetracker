'use client';

import { Expense } from '@/lib/finance';
import { CategoryPill } from './CategoryPill';

export function ExpenseList({
  expenses,
  onDelete
}: {
  expenses: Expense[];
  onDelete: (id: string) => void;
}) {
  if (expenses.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No expenses found for this period.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {expenses.map((exp) => (
        <div 
          key={exp.id} 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CategoryPill category={exp.category} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{exp.description || 'Unnamed Expense'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>{exp.date}</span>
              <span>•</span>
              <span>{exp.who}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 600 }}>€{Number(exp.amount).toFixed(2)}</span>
            <button 
              onClick={() => exp.id && onDelete(exp.id)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: 16 }}
              title="Delete Expense"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
