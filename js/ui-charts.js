/* ═══════════════════════════════════════════════
   ui-charts.js — All Chart.js Rendering
   Extracted from ui.js as part of Operation Modular.
   Depends on: state.js, utils.js, finance.js
═══════════════════════════════════════════════ */

/* Chart instances — kept here to prevent double-instantiation on renderAll() */
let chartUsers = null;
let chartCats  = null;
let chartTrends, chartRadar;

/* Helper: build a category → total map from an expense array */
function catsObj(all) {
  var c = {};
  all.forEach(function(e) { c[e.category] = (c[e.category] || 0) + Number(e.amount); });
  return c;
}

/* Render the two monthly summary charts (doughnut + bar) */
function updateCharts(userSpend, catTotals) {
  const ctxU = document.getElementById('chart-users');
  const ctxC = document.getElementById('chart-categories');
  if (!ctxU || !ctxC || typeof Chart === 'undefined') return;

  const isDark = document.body.getAttribute('data-theme') === 'dark';
  Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
  Chart.defaults.font.family = "'Outfit', sans-serif";

  const userKeys = Object.keys(NAMES);
  const labels   = userKeys.map(k => NAMES[k]);
  const data     = userKeys.map(k => userSpend[k] || 0);

  if (chartUsers) chartUsers.destroy();
  chartUsers = new Chart(ctxU, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6', '#f59e0b'],
        borderWidth: 0,
        cutout: '70%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: t('Spent by User'), font: { size: 14 } }
      }
    }
  });

  const catLabels = Object.keys(catTotals).filter(k => catTotals[k] > 0);
  const catData   = catLabels.map(k => catTotals[k]);

  if (chartCats) chartCats.destroy();
  chartCats = new Chart(ctxC, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{
        label: t('Spent'),
        data: catData,
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: isDark ? '#334155' : '#e2e8f0' } },
        x: { grid: { display: false } }
      }
    }
  });
}

/* Render 6-month spending vs income trend (line chart) */
function renderTrends() {
  const ctx = document.getElementById('chart-trends')?.getContext('2d');
  if (!ctx || typeof Chart === 'undefined') return;

  const labels = [], spendData = [], incomeData = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.toISOString().slice(0, 7);
    labels.push(d.toLocaleString(LANG === 'sk' ? 'sk-SK' : 'en-US', { month: 'short' }));
    const mTotal = expenses.filter(e => e.date && e.date.startsWith(mStr))
                           .reduce((s, e) => s + Number(e.amount), 0);
    spendData.push(mTotal);
    incomeData.push(Object.values(INCOME).reduce((a, b) => a + Number(b), 0));
  }

  if (chartTrends) chartTrends.destroy();
  chartTrends = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('Spent'),
          data: spendData,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true, tension: 0.4, borderWidth: 3,
          pointRadius: 4, pointBackgroundColor: '#8b5cf6'
        },
        {
          label: t('Income') || 'Income',
          data: incomeData,
          borderColor: '#0ea5e9',
          borderDash: [5, 5],
          tension: 0, fill: false, borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(...spendData, ...incomeData) * 1.2,
          ticks: { callback: v => '€' + v }
        }
      },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

/* Render the category concentration radar chart */
function renderRadar() {
  const ctx = document.getElementById('chart-radar')?.getContext('2d');
  if (!ctx || typeof Chart === 'undefined') return;

  const catTotals = {};
  const m = curMonth();
  expenses.filter(e => e.date && e.date.startsWith(m))
          .forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount); });

  const labels = CATS;
  const data   = labels.map(c => catTotals[c] || 0);

  if (chartRadar) chartRadar.destroy();
  chartRadar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: t('Category Concentration'),
        data,
        backgroundColor: 'rgba(79, 70, 229, 0.4)',
        borderColor: '#4f46e5',
        borderWidth: 2, pointBackgroundColor: '#4f46e5', pointRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          angleLines: { color: 'rgba(0,0,0,0.05)' },
          ticks: { display: false },
          pointLabels: { font: { size: 12, weight: '600' } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

/* Heatmap logic is merged into renderCalendar in ui.js */
function renderHeatmap() {}
