'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Expense, calcCategoryTotals } from '@/lib/finance';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

const CHART_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', 
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'
];

export function SpendingBreakdown({ expenses }: { expenses: Expense[] }) {
  const totals = calcCategoryTotals(expenses);
  const categories = Object.keys(totals).filter(c => c !== 'Adjustment'); // Adjustments usually skew charts
  const values = categories.map(c => totals[c]);

  const data = {
    labels: categories,
    datasets: [
      {
        data: values,
        backgroundColor: CHART_COLORS,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: 'Inter' },
        },
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: 300, width: '100%' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export function DailyTrend({ expenses }: { expenses: Expense[] }) {
  // Aggregate spend by day
  const daily = expenses.reduce((acc: Record<string, number>, e) => {
    if (e.category === 'Savings' || e.category === 'Adjustment') return acc;
    const day = e.date.slice(8, 10); // DD
    acc[day] = (acc[day] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});

  const labels = Object.keys(daily).sort();
  const values = labels.map(l => daily[l]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Spent (€)',
        data: values,
        backgroundColor: '#6366F1',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div style={{ height: 200, width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
