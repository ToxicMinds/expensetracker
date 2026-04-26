/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════ */
function checkMonthlyRitual() {
  const now = new Date();
  const day = now.getDate();
  const monthStr = now.toISOString().slice(0, 7); 
  const dismissed = MEMORY.last_ritual_month;

  if (dismissed === monthStr) return;

  // Meaningful Check: Don't nudge if they only just started
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const prevMonth = d.toISOString().slice(0, 7);
  const prevExpenses = expenses.filter(e => e.date && e.date.startsWith(prevMonth));
  
  if (prevExpenses.length < 15) {
    // Too few entries to be meaningful, or they are a new user.
    return;
  }

  if (day === 1) {
    openRitual();
  } else {
    showRitualNudge();
  }
}

function showRitualNudge() {
  const nudge = document.getElementById('ritual-nudge');
  if (nudge) nudge.style.display = 'flex';
}

function openRitual() {
  const overlay = document.getElementById('ritual-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  generateMonthlySummary();
}

function dismissRitual() {
  const monthStr = new Date().toISOString().slice(0, 7);
  MEMORY.last_ritual_month = monthStr;
  sbSaveState().catch(() => {}); // Persist to DB for cross-device sync
  document.getElementById('ritual-overlay').classList.remove('open');
  document.getElementById('ritual-nudge').style.display = 'none';
}

async function generateMonthlySummary() {
  const content = document.getElementById('ritual-content');
  content.innerHTML = '<div class="te"><span class="spin"></span> Analyzing last month...</div>';
  
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const prevMonth = d.toISOString().slice(0, 7);
  const prevMonthName = d.toLocaleString('en-US', { month: 'long' });

  const prevExpenses = expenses.filter(e => e.date && e.date.startsWith(prevMonth));
  const spent = prevExpenses.filter(e => e.category !== 'Savings').reduce((s, e) => s + Number(e.amount), 0);
  const saved = prevExpenses.filter(e => e.category === 'Savings').reduce((s, e) => s + Number(e.amount), 0);

  let summary = `In ${prevMonthName}, you spent **€${fmt(spent)}** and saved **€${fmt(saved)}**. `;
  
  const suggestions = CATS.map(cat => {
     const catSpent = prevExpenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
     const currentBud = BUDGETS[cat] || 0;
     const diff = catSpent - currentBud;
     if (Math.abs(diff) > 20) {
       return `<li>${cat}: Spent €${fmt(catSpent)} (Target was €${fmt(currentBud)}).</li>`;
     }
     return null;
  }).filter(x => x).join('');

  content.innerHTML = `
    <div style="font-size:15px; margin-bottom:15px; color:var(--text)">${summary}</div>
    <div style="font-size:12px; font-weight:700; margin-bottom:8px; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em">Historical Context</div>
    <ul style="font-size:13px; padding-left:18px; margin-bottom:20px; color:var(--text); line-height:1.6">
      ${suggestions || '<li>Excellent discipline! All categories were within €20 of budget.</li>'}
    </ul>
    <div style="font-size:12px; color:var(--muted); font-style:italic">Would you like to adjust your current budgets to match last month's actual spending?</div>
  `;
}

async function applyRitualBudgets() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const prevMonth = d.toISOString().slice(0, 7);
  const prevExpenses = expenses.filter(e => e.date && e.date.startsWith(prevMonth));

  CATS.forEach(cat => {
    const catSpent = prevExpenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
    if (catSpent > 0) BUDGETS[cat] = Math.round(catSpent);
  });

  await sbSaveState();
  renderAll();
  dismissRitual();
  flash("Budgets updated based on last month's performance!", false);
}

function getTopVendors(limit = 6) {
  const counts = {};
  expenses.slice(0, 150).forEach(e => {
    if (!e.description) return;
    const key = e.description.trim().toUpperCase();
    if (!counts[key]) counts[key] = { count: 0, category: e.category, original: e.description };
    counts[key].count++;
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function quickFill(desc, cat) {
  // Clear any previous form state
  cancelEdit(); 
  
  document.getElementById('fdesc').value = desc;
  document.getElementById('fcat').value = cat;
  
  // Focus amount for quick entry
  const amtInput = document.getElementById('famt');
  if (amtInput) {
    amtInput.value = '';
    amtInput.focus();
  }
  
  // Scroll to form
  const form = document.getElementById('form-title');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderQuickEntry() {
  const container = document.getElementById('quick-entry-container');
  if (!container) return;
  const tops = getTopVendors();
  if (tops.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <div style="font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; margin-bottom:8px; padding-left:4px">Frequent</div>
    <div class="h-scroll" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; -webkit-overflow-scrolling:touch;">
      ${tops.map(t => `
        <button class="btn-g" style="white-space:nowrap; padding:8px 16px; font-size:13px; border-radius:14px; background:var(--bg-soft); border:1px solid var(--border); box-shadow:0 1px 2px rgba(0,0,0,0.05)" 
                onclick="quickFill('${esc(t.original)}', '${esc(t.category)}')">
          ${esc(t.original)}
        </button>
      `).join('')}
    </div>
  `;
}

// checkEkasa → moved to ui-scanner.js

/* ═══════════════════════════════════════════════
   UI & RENDER
═══════════════════════════════════════════════ */
// Map user index to CSS classes for pills and buttons
const USER_BTN_CLS  = ['an', 'az', 'a3', 'a4'];
const USER_PILL_CLS = ['pn', 'pz', 'p3', 'p4'];
function userPillClass(name) {
  const idx = Object.values(NAMES).indexOf(name);
  return USER_PILL_CLS[idx] !== undefined ? USER_PILL_CLS[idx] : 'pc';
}

function applyNamesUI() {
  const userKeys = Object.keys(NAMES);
  const isSingle = userKeys.length === 1;

  // 1. Add Expense Toggle Buttons (dynamic colors)
  const toggleContainer = document.getElementById('user-toggles-container');
  if (toggleContainer) {
    toggleContainer.innerHTML = userKeys.map((key, i) => `
      <button class="wbtn ${USER_BTN_CLS[i] || 'an'} ${currentWhoId === key ? 'active' : ''}" 
              data-user-id="${key}"
              onclick="setWho('${key}')">${esc(NAMES[key])}</button>
    `).join('');
  }

  const filterContainer = document.getElementById('filter-user-toggles');
  if (filterContainer) {
    filterContainer.innerHTML = userKeys.map((key, i) => `
      <button class="wbtn ${USER_BTN_CLS[i] || 'an'} ${swho === key ? 'active' : ''}" 
              data-user-id="${key}"
              onclick="setSWho('${key}')">${esc(NAMES[key])}</button>
    `).join('');
  }

  // 3. Scanner Toggles (Independent from filter)
  const scannerContainer = document.getElementById('scanner-user-toggles');
  if (scannerContainer) {
    scannerContainer.innerHTML = userKeys.map((key, i) => `
      <button class="wbtn ${USER_BTN_CLS[i] || 'an'} ${scannerWhoId === key ? 'active' : ''}" 
              data-user-id="${key}"
              onclick="setScannerWho('${key}')">${esc(NAMES[key])}</button>
    `).join('');
  }

  // 3. Filter Dropdown
  const fwhoSelect = document.getElementById('fwho');
  if (fwhoSelect) {
    fwhoSelect.innerHTML = '<option value="">All Members</option>' + 
      userKeys.map(key => `<option value="${key}">${esc(NAMES[key])}</option>`).join('');
    fwhoSelect.value = swho; // Preserve the filter selection
  }

  // 4. Settings Grid
  const settingsGrid = document.getElementById('set-members-grid');
  if (settingsGrid) {
    settingsGrid.innerHTML = userKeys.map(key => `
      <div class="fg"><div class="fl">${esc(NAMES[key])} Name</div><input type="text" id="set-name-${key}" value="${esc(NAMES[key])}"></div>
      <div class="fg"><div class="fl">${esc(NAMES[key])} Income (€)</div><input type="number" id="set-inc-${key}" min="0" step="0.01" value="${INCOME[key] || 0}"></div>
    `).join('');
  }

  // 5. Hide chart if single user
  const chartCard = document.getElementById('chart-users')?.closest('.card');
  if (chartCard) chartCard.style.display = isSingle ? 'none' : 'block';
}
function applyCatsUI() {
  var cb=document.getElementById('bud-cats');
  var fcat=document.getElementById('fcat');
  var clist=document.getElementById('cat-list');
  var fcf=document.getElementById('fcatf');
  
  if(cb) cb.innerHTML=CATS.map(function(c){
    return '<div class="fg"><div class="fl">'+c+'</div><input type="number" id="bc_'+c+'" value="'+BUDGETS[c]+'"></div>';
  }).join('');
  
  if(clist) clist.innerHTML=getCategoryOptions();
  if(fcat && fcat.tagName === 'SELECT') fcat.innerHTML=getCategoryOptions(); // Fallback for selects
  if(fcf) fcf.innerHTML='<option value="">All Categories</option>'+getCategoryOptions();
}

function setWho(id) {
  currentWhoId = id;
  applyNamesUI();
}
function setScannerWho(id) {
  scannerWhoId = id;
  // Re-render only the scanner toggles to keep UI responsive
  const scannerContainer = document.getElementById('scanner-user-toggles');
  if (scannerContainer) {
    const userKeys = Object.keys(NAMES);
    scannerContainer.innerHTML = userKeys.map((key, i) => `
      <button class="wbtn ${USER_BTN_CLS[i] || 'an'} ${scannerWhoId === key ? 'active' : ''}" 
              data-user-id="${key}"
              onclick="setScannerWho('${key}')">${esc(NAMES[key])}</button>
    `).join('');
  }
}

function initMonths() {
  var sel=document.getElementById('msel');
  var prev=sel.value;
  var mo={};
  var cur=today().slice(0,7);
  mo[cur]=1;
  expenses.forEach(function(e){if(e.date)mo[String(e.date).slice(0,7)]=1;});
  sel.innerHTML=Object.keys(mo).sort().reverse().map(function(m){
    var p=m.split('-');
    return '<option value="'+m+'"'+(m===prev?' selected':'')+'>'+
      new Date(+p[0],+p[1]-1).toLocaleString('en',{month:'long',year:'numeric'})+'</option>';
  }).join('');
  if(!sel.value)sel.value=cur;
}
function curMonth(){return document.getElementById('msel').value;}
function moExp(){var m=curMonth();return expenses.filter(function(e){return e.date&&String(e.date).slice(0,7)===m;});}
function filtExp(){
  var w=document.getElementById('fwho').value,c=document.getElementById('fcatf').value;
  return moExp().filter(function(e){
    if(w && (e.who_id !== w && e.who !== NAMES[w])) return false;
    if(c && (e.cat_id !== c && e.category !== c)) return false; // Cat fallback too
    return true;
  });
}

function renderAll(){
  renderCards();
  renderBudget();
  renderGoals();
  renderBankSync();
  renderQuickEntry();
  if (viewMode === 'log') {
    renderLog();
  } else {
    renderCalendar();
  }
}

var viewMode = 'log'; // 'log' or 'calendar'
var analysisMode = 'monthly'; // 'monthly' or 'advanced'

function toggleViewMode() {
  viewMode = viewMode === 'log' ? 'calendar' : 'log';
  document.getElementById('viewToggleBtn').textContent = viewMode === 'log' ? 'List View' : 'Calendar View';
  document.getElementById('log-container').style.display = viewMode === 'log' ? 'block' : 'none';
  document.getElementById('calendar-container').style.display = viewMode === 'log' ? 'none' : 'block';
  renderAll();
}

function toggleAnalysisMode() {
  analysisMode = analysisMode === 'monthly' ? 'advanced' : 'monthly';
  document.getElementById('analysisToggleBtn').textContent = analysisMode === 'monthly' ? '6-Month Trends' : 'Monthly View';
  document.getElementById('monthly-charts').style.display = analysisMode === 'monthly' ? 'contents' : 'none';
  document.getElementById('advanced-charts').style.display = analysisMode === 'monthly' ? 'none' : 'grid';
  if (analysisMode === 'advanced') {
    renderTrends();
    renderRadar();
  }
}

async function renderCalendar() {
  const monthEl = document.getElementById('calendar-grid');
  if(!monthEl) return;
  const month = curMonth(); // e.g., "2026-04"
  if (!month) return;
  
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  
  monthEl.innerHTML = '<div style="grid-column:1/-1; text-align:center;"><span class="spin"></span></div>';
  
  try {
    const start = month + '-01';
    const end = month + '-' + daysInMonth;
    
    // Fetch Invoices
    const invoices = await fetch(REST_INVOICES + '?household_id=eq.' + HOUSEHOLD_ID + '&date=gte.' + start + '&date=lte.' + end, {headers:sbH()})
      .then(r => r.json());
      
    // Filter local expenses for this month
    const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(month));

    // Calculate heat data
    const dayTotals = new Array(daysInMonth).fill(0);
    monthExpenses.forEach(e => {
      const d = parseInt(e.date.split('-')[2]);
      if (d >= 1 && d <= daysInMonth) dayTotals[d-1] += Number(e.amount);
    });
    const maxSpend = Math.max(...dayTotals, 1);

    let html = '';
    for(let d=1; d<=daysInMonth; d++) {
      const dateStr = month + '-' + String(d).padStart(2,'0');
      const dayInvs = invoices.filter(i => i.date === dateStr);
      const dayExps = monthExpenses.filter(e => e.date === dateStr);
      const spent = dayTotals[d-1];
      
      const hasSomething = dayInvs.length > 0 || dayExps.length > 0;
      
      // Heatmap color logic
      const alpha = spent > 0 ? Math.min(1, spent / (maxSpend * 0.7)) : 0;
      const bgColor = spent > 0 ? `rgba(59, 130, 246, ${Math.max(0.1, alpha)})` : 'transparent';
      
      const cls = hasSomething ? 'calendar-day has-invoice' : 'calendar-day';
      const style = spent > 0 ? `style="background-color: ${bgColor}; border-color: var(--accent)"` : '';
      
      let inner = `<div class="day-num">${d}</div>`;
      if(spent > 0) {
        inner += `<div class="day-amt">€${Math.round(spent)}</div>`;
      } else if (dayInvs.length > 0) {
        inner += `<div class="day-amt" style="opacity:0.5; font-size:10px">Invoices</div>`;
      }
      
      html += `<div class="${cls}" ${style} onclick="showDayDetails('${dateStr}')">${inner}</div>`;
    }
    monthEl.innerHTML = html;
  } catch(e) {
    monthEl.innerHTML = '<div style="grid-column:1/-1; color: var(--danger)">Failed to load invoices.</div>';
  }
}

function showDayDetails(dateStr) {
  // Highlight selected day on calendar
  document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
  const dayEls = document.querySelectorAll('.calendar-day');
  dayEls.forEach(d => { if (d.getAttribute('onclick') && d.getAttribute('onclick').includes(dateStr)) d.classList.add('selected'); });

  var exps = expenses.filter(e => e.date === dateStr);
  if (exps.length === 0) {
    document.getElementById('calendar-details').innerHTML =
      `<div class="te" style="padding:20px; color:var(--muted)">${t('No entries for')} ${fmtDate(dateStr)}</div>`;
    return;
  }

  const dayTotal = exps.reduce((s, e) => s + Number(e.amount), 0);
  var html = `<div style="font-weight:600; font-size:15px; margin-bottom:12px; color:var(--text)">${t('Details for')} ${fmtDate(dateStr)} <span style="font-family:var(--mono); color:var(--muted); font-size:13px;">· €${fmt(dayTotal)}</span></div>`;
  html += '<div style="display:flex; flex-direction:column; gap:8px;">';

  exps.forEach(e => {
    const pillCls = userPillClass(e.who);
    html += `
      <div class="panel" style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:600; font-size:13px;">${esc(e.category)}</div>
          <div style="font-size:12px; color:var(--muted); margin-top:2px;">${esc(e.description || '—')}</div>
          <div style="font-size:11px; color:var(--muted); margin-top:3px;">
            <span class="pill ${pillCls}" style="padding:2px 6px">${esc(NAMES[e.who_id] || e.who)}</span>
          </div>
        </div>
        <div style="font-family:var(--mono); font-weight:700; font-size:15px; color:var(--text)">€${fmt(e.amount)}</div>
      </div>`;
  });

  html += '</div>';
  document.getElementById('calendar-details').innerHTML = html;
}

function renderCards(){
  const all      = moExp();
  const userKeys = Object.keys(NAMES);
  const now      = new Date();

  // ── FINANCIAL CALCULATIONS (via finance.js) ──────────────────────────────
  const { spent, saved }                = calcTotals(all);
  const { remaining, pct, status: rc }  = calcBudgetStatus(spent, TOTAL_B);
  const { delta, deltaStr, deltaColor } = calcMonthDelta(expenses, curMonth(), spent);
  const { projected, diff }             = calcForecast(all, TOTAL_B, now);
  const userSpend                       = calcPerUserSpend(all, NAMES);
  const totInc    = userKeys.reduce((s, k) => s + (Number(INCOME[k]) || 0), 0);
  const { netSavings, pct: savPct }     = calcNetSavings(totInc, spent);
  const sc = netSavings < 0 ? 'bad' : 'good';

  // Helper for generating flipped cards
  const card = (label, value, sub, info, extraClass = '', style = '') => `
    <div class="card-container">
      <div class="card-flipper">
        <div class="card card-front ${extraClass}" style="${style}">
          <div class="cl">${label} <span class="h-tip" onclick="toggleCardFlip(this)">ⓘ</span></div>
          <div class="cv">${value}</div>
          <div class="cs">${sub}</div>
        </div>
        <div class="card card-back" style="${style}">
          <div class="cl">${label} <span class="h-tip" onclick="toggleCardFlip(this)">✕</span></div>
          <div class="card-info-text">${info}</div>
        </div>
      </div>
    </div>
  `;

  // ── BUILD CARD HTML ──────────────────────────────────────────────────────
  let html = card(
    'Total Spent', 
    `€${fmt(spent)}`, 
    `<span style="color:${deltaColor}">${delta > 0 ? '▲' : '▼'} ${deltaStr}</span> vs last month`,
    'Sum of all expenses this month, excluding Savings and Adjustments. This is your core cost of living.'
  );

  html += card(
    'Budget Left',
    `€${fmt(remaining)}`,
    `${pct}% used of €${TOTAL_B}`,
    'Current monthly budget minus actual spending. Keeps you on track for your financial goals.',
    rc
  );

  html += card(
    'Forecast',
    `€${fmt(projected)}`,
    `<span style="color:${diff > 0 ? 'var(--danger)' : 'var(--success)'}">${diff > 0 ? '⚠️ €'+fmt(diff)+' OVER' : '✅ €'+fmt(Math.abs(diff))+' UNDER'}</span>`,
    'Projected end-of-month spend based on your variable daily rate. Recurring bills are excluded from the daily rate so they do not inflate the projection.',
    diff > 0 ? 'bad' : 'good',
    'border:1px solid var(--border-soft)'
  );

  html += card(
    'Total Saved',
    `€${fmt(saved)}`,
    'Kept this month',
    'Sum of all entries in the Savings category. This is money kept, not spent.',
    '',
    'border-top:3px solid #10b981'
  );

  html += card(
    'Net Savings',
    `€${fmt(netSavings)}`,
    `${savPct}% of income kept`,
    'Total Income minus Total Spent. Your real monthly profit and the true measure of your financial health.',
    sc,
    'border-left:4px solid var(--nikhil)'
  );

  const userColors = ['nikhil', 'zuzana', 'u3', 'u4'];
  userKeys.forEach(function(k, i) {
    const color      = userColors[i % 4];
    const entryCount = all.filter(function(e) { return e.who_id === k || (!e.who_id && e.who === NAMES[k]); }).length;
    html += card(
      esc(NAMES[k]),
      `€${fmt(userSpend[k])}`,
      `${entryCount} entries`,
      `Spending attributed to ${esc(NAMES[k])} this month (excluding Savings).`,
      '',
      `border-top: 3px solid var(--${color}); color: var(--${color})`
    );
  });

  document.getElementById('cards').innerHTML = html;

  // ── ALERT BAR ────────────────────────────────────────────────────────────
  const bar = document.getElementById('alertbar');
  if (bar) {
    if (remaining < 0) {
      bar.className = 'alertbar d'; bar.style.display = 'block';
      bar.textContent = '⚠️ You are €' + fmt(Math.abs(remaining)) + ' over budget this month.';
    } else if (pct > 80) {
      bar.className = 'alertbar w'; bar.style.display = 'block';
      bar.textContent = '⚡ ' + pct + '% of total budget used — €' + fmt(remaining) + ' remaining.';
    } else {
      bar.style.display = 'none';
    }
  }

  updateCharts(userSpend, calcCategoryTotals(all));
}

// catsObj, chartUsers, chartCats, updateCharts → moved to ui-charts.js

// updateCharts → moved to ui-charts.js


function renderBudget(){
  var cats={};
  moExp().forEach(function(e){cats[e.category]=(cats[e.category]||0)+Number(e.amount);});
  document.getElementById('budbars').innerHTML=CATS.map(function(cat){
    var b=BUDGETS[cat],sp=cats[cat]||0,p=Math.min(100,Math.round(sp/b*100)),c=p>=100?'ov':p>=80?'hi':'ok';
    return '<div class="budr"><div class="budn">'+cat+'</div><div class="budt"><div class="budf '+c+'" style="width:'+p+'%"></div></div>'+
      '<div class="buda"><span class="sp '+c+'">'+fmt(sp)+'</span> /€'+b+'</div></div>';
  }).join('');
}

function renderLog(){
  var rows=filtExp().slice().sort(function(a,b){
    var d=String(b.date).localeCompare(String(a.date));
    return d!==0?d:String(b.id).localeCompare(String(a.id));
  });
  var tb=document.getElementById('logbody');
  if(!rows.length){tb.innerHTML='<tr><td colspan="6" class="te">No expenses found.<br><small style="color:var(--muted);font-size:11px">💡 On mobile: swipe right to delete, left to edit</small></td></tr>';document.getElementById('logtot').textContent='€0.00';return;}
  var tot=rows.reduce(function(s,e){return s+Number(e.amount);},0);
  tb.innerHTML=rows.map(function(e){
    var pillCls = userPillClass(e.who);
    var displayName = esc(NAMES[e.who_id] || e.who);
    return '<tr class="swipe-row" data-expense-id="'+e.id+'">'+
      '<td class="act-col desktop-only" style="text-align:center">'+
        '<span style="cursor:pointer; padding:5px" onclick="startEdit(\''+e.id+'\')">✎</span>'+
        '<span style="cursor:pointer; padding:5px; color:var(--danger)" onclick="deleteExp(\''+e.id+'\')">🗑</span>'+
      '</td>'+
      '<td style="font-family:var(--mono);font-size:11px;color:var(--muted);white-space:nowrap">'+fmtDate(e.date)+'</td>'+
      '<td><span class="pill '+pillCls+'" style="font-size:11px">'+displayName+'</span></td>'+
      '<td><span class="pill pc" style="font-weight:600; font-size:11px">'+esc(e.category)+'</span></td>'+
      '<td style="font-size:13px; color:var(--text); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">'+esc(e.description||'—')+'</td>'+
      '<td class="ac" style="font-weight:700; font-family:var(--mono); text-align:right">€'+fmt(e.amount)+'</td>'+
      '</tr>';
  }).join('');
  document.getElementById('logtot').textContent=fmt(tot);
  attachSwipeHandlers();
}

function attachSwipeHandlers() {
  document.querySelectorAll('.swipe-row').forEach(function(row) {
    var startX = 0, startY = 0, dx = 0, swiping = false;
    var threshold = 80;
    var expId = row.getAttribute('data-expense-id');

    row.addEventListener('touchstart', function(ev) {
      startX = ev.touches[0].clientX;
      startY = ev.touches[0].clientY;
      dx = 0; swiping = false;
      row.style.transition = 'none';
      
      // Add indicators if they don't exist
      if (!row.querySelector('.swipe-indicator')) {
        row.insertAdjacentHTML('afterbegin', '<div class="swipe-indicator left">DELETE</div><div class="swipe-indicator right">EDIT</div>');
      }
    }, {passive: false});

    row.addEventListener('touchmove', function(ev) {
      var curX = ev.touches[0].clientX;
      var curY = ev.touches[0].clientY;
      var absDx = Math.abs(curX - startX);
      var absDy = Math.abs(curY - startY);
      
      if (!swiping) {
        if (absDy > absDx) return; // scroll wins
        if (absDx > 10) swiping = true;
      }
      
      if (swiping) {
        if (ev.cancelable) ev.preventDefault();
        dx = curX - startX;
        var clamped = Math.max(-130, Math.min(130, dx));
        row.style.transform = 'translateX(' + clamped + 'px)';
        
        var indDel = row.querySelector('.swipe-indicator.left');
        var indEdit = row.querySelector('.swipe-indicator.right');
        
        if (dx > 20) {
          row.style.background = 'rgba(239,68,68,0.2)';
          if(indDel) { indDel.style.opacity = 1; indDel.style.zIndex = 5; }
          if(indEdit) indEdit.style.opacity = 0;
        } else if (dx < -20) {
          row.style.background = 'rgba(16,185,129,0.15)'; // Green background for edit
          if(indEdit) { indEdit.style.opacity = 1; indEdit.style.zIndex = 5; indEdit.textContent = 'UPDATE'; }
          if(indDel) indDel.style.opacity = 0;
        } else {
          row.style.background = '';
          if(indDel) indDel.style.opacity = 0;
          if(indEdit) indEdit.style.opacity = 0;
        }
      }
    }, {passive: false});

    row.addEventListener('touchend', function() {
      row.style.transition = 'transform 0.25s cubic-bezier(.4,0,.2,1), background 0.2s';
      row.style.transform = '';
      row.style.background = '';
      var indDel = row.querySelector('.swipe-indicator.left');
      var indEdit = row.querySelector('.swipe-indicator.right');
      if(indDel) indDel.style.opacity = 0;
      if(indEdit) indEdit.style.opacity = 0;
      
      if (!swiping) return;
      if (dx > threshold) {
        if (confirm('Delete this expense?')) deleteExp(expId);
      } else if (dx < -threshold) {
        startEdit(expId);
      }
      dx = 0; swiping = false;
    }, {passive: true});
  });
}

function exportCSV() {
  if (!expenses || expenses.length === 0) {
    flash('No data to export', true);
    return;
  }
  const headers = ['Date', 'Who', 'Category', 'Description', 'Amount'];
  const rows = expenses
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map(e => [
      fmtDate(e.date),
      e.who || '',
      e.category || '',
      (e.description || '').replace(/,/g, ';'),
      Number(e.amount).toFixed(2)
    ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const month = curMonth ? curMonth() : new Date().toISOString().slice(0,7);
  a.href = url;
  a.download = `expenses-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  flash(`Exported ${rows.length} expenses to CSV`);
}


// showReview, cancelReview, openScanner, closeScanner, showStep, showEkasaStatus → moved to ui-scanner.js

/* ═══════════════════════════════════════════════
   SETTINGS & MODALS
═══════════════════════════════════════════════ */
function closeSettings() {
  document.getElementById('nav-modal')?.classList.remove('open');
  document.getElementById('settings-modal')?.classList.remove('open');
}

function openInsights() {
  document.getElementById('insights-modal').classList.add('open');
  var m = curMonth();
  var pParts = m.split('-');
  document.getElementById('insights-month-label').textContent = 'Analysing '+new Date(+pParts[0],+pParts[1]-1).toLocaleString('en',{month:'long',year:'numeric'})+'...';
  document.getElementById('insights-body').innerHTML = '<span class="spin spin-lg"></span>';
  generateInsights(m);
}
function closeInsights() { document.getElementById('insights-modal').classList.remove('open'); }

function addGoalUI() { document.getElementById('goal-modal').classList.add('open'); }
function closeGoalModal() { document.getElementById('goal-modal').classList.remove('open'); }

function renderGoals() {
  if(!document.getElementById('goals-row')) return;
  if(GOALS.length > 0) document.getElementById('goals-row').style.display = 'grid';
  var list = document.getElementById('goals-list');
  if(!list) return;
  
  if(GOALS.length === 0) {
    list.innerHTML = '<div style="font-size:13px;color:var(--muted)">No goals yet. Add your first one above.</div>';
    return;
  }
  
  list.innerHTML = GOALS.map(function(g) {
    var p = Math.min(100, Math.round((g.saved / g.target) * 100));
    var dl = g.deadline ? t('Target') + ': ' + new Date(g.deadline).toLocaleDateString(LANG === 'sk' ? 'sk-SK' : 'en-GB') : '';
    
    // Premium Goal Card with visual accent
    const color = p >= 100 ? 'var(--accent)' : (p > 50 ? 'var(--info)' : 'var(--muted)');

    return `
      <div class="panel" style="border-left: 4px solid ${color}; padding: 1rem; margin-bottom: 0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
          <div>
            <div style="font-weight:600; font-size:14px; color:var(--text)">${esc(g.name)}</div>
            <div style="font-size:11px; color:var(--muted); margin-top:2px;">${p}% ${t('Remaining')} • ${dl}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:var(--mono); font-size:14px; font-weight:600; color:${color}">€${fmt(g.saved)}</div>
            <div style="font-size:10px; color:var(--muted)">of €${fmt(g.target)}</div>
          </div>
        </div>
        <div class="goal-track" style="height:8px; background:var(--bg); border-radius:10px;">
          <div class="goal-fill" style="width:${p}%; background:${color}; border-radius:10px; transition:width 1s cubic-bezier(0.34, 1.56, 0.64, 1)"></div>
        </div>
        <button class="db-del" style="position:absolute; top:8px; right:8px; font-size:14px; border:none; background:none; cursor:pointer;" onclick="deleteGoal('${g.id}')">&times;</button>
      </div>`;
  }).join('');
}

// renderSettingsRules, renderBankSync, renderBudgetsGrid, openBankPicker,
// connectGoogleCalendar, disconnectGoogleCalendar, syncToGCal, syncAllToGCal,
// renderIntegrations, openSettings, closeSettings → moved to ui-settings.js


/* ═══════════════════════════════════════════════
   AUTHENTICATION LOGIC
═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   AUTHENTICATION LOGIC (MOVED TO auth.js)
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   ONBOARDING LOGIC
═══════════════════════════════════════════════ */
function nextOB(step) {
  // If moving FROM Step 2 TO Step 3, validate name
  if (step === 3) {
    const hname = document.getElementById('ob-hname').value.trim();
    if (!hname) { alert('Please name your household first'); return; }
  }
  document.querySelectorAll('.ob-step').forEach(s => s.style.display = 'none');
  document.getElementById('ob-step-' + step).style.display = 'block';
}

function addOBMember() {
  const list = document.getElementById('ob-members-list');
  const count = list.querySelectorAll('.ob-member-row').length;
  if (count >= 4) return;
  const div = document.createElement('div');
  div.className = 'ob-member-row';
  div.style.display = 'flex';
  div.style.gap = '10px';
  div.innerHTML = `<input type="text" class="ob-m-name" placeholder="Member Name" style="flex:1">`;
  list.appendChild(div);
}


/* ═══════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════ */
function changeLanguage(val) {
  LANG = val;
  localStorage.setItem('sf_lang', LANG);
  applyTranslations();
  render(); // Re-render charts/lists
}

function applyTranslations() {
  const mappings = {
    'lbl-auth-title': 'Login', // Title key
    'lbl-auth-sub': 'Secure access to your household',
    'lbl-family-passcode': '🔐 Family Passcode',
    'lbl-btn-pin-enter': 'Unlock Household',
    'lbl-auth-or-text': 'OR SIGN IN WITH',
    'lbl-continue-google': 'Google Account',
    'lbl-show-advanced': 'Advanced: Username & Password',
    'lbl-btn-enter': 'Login',
    'lbl-set-lang': 'Language',
    // Settings
    'lbl-set-title': 'Financial Plan & Settings',
    'lbl-set-sub': 'Update your monthly income and budget limits based on your financial plan.',
    'lbl-set-members': 'Household Members',
    'lbl-set-budgets': 'Monthly Budgets',
    'lbl-btn-add-cat': '+ Add Custom',
    'lbl-set-rules': 'Smart Rules',
    'lbl-btn-add-rule': '+ Add Rule',
    'lbl-set-rules-sub': 'Auto-categorize items matching a keyword. Applied before AI.',
    'lbl-set-banks': 'Bank Connections (Enable Banking)',
    'lbl-btn-connect-bank': '+ Connect Bank',
    'lbl-set-banks-sub': 'Connect professional banking feeds via Enable Banking (Supports Tatra Banka, VUB, SLSP, Revolut).',
    'lbl-set-integrations': 'Integrations',
    'lbl-insights-title': '💡 Monthly Insights',
  };
  
  Object.keys(mappings).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(mappings[id]);
  });
  
  // Placeholders
  const user = document.getElementById('auth-user');
  if (user) user.placeholder = t('Username / Household name');
  const pass = document.getElementById('auth-pass');
  if (pass) pass.placeholder = t('Password');
  
  // Filter Dropdown: Re-init to update 'All Members' etc
  initMonths();
  applyNamesUI(); 
  applyCatsUI();
}

/* ═══════════════════════════════════════════════
   THEMING
═══════════════════════════════════════════════ */
function toggleTheme() {
  var b = document.body;
  if(b.getAttribute('data-theme') === 'dark') {
    b.removeAttribute('data-theme');
    localStorage.setItem('sf_theme', 'light');
  } else {
    b.setAttribute('data-theme', 'dark');
    localStorage.setItem('sf_theme', 'dark');
  }
  if(typeof renderCards === 'function') renderCards();
}

/* ═══════════════════════════════════════════════
   RECURRING BILLS UI
═══════════════════════════════════════════════ */
async function openSettings() {
  document.getElementById('nav-modal')?.classList.add('open');
  document.getElementById('settings-modal').classList.add('open');
  
  if (document.getElementById('set-h-handle')) {
    document.getElementById('set-h-handle').value = HOUSEHOLD_HANDLE || '';

  }
  
  applyNamesUI();
  renderSettingsRules();
  renderBudgetsGrid();
  renderIntegrations();
  await renderRecurring();
}

// renderRecurring, addRecurringUI, deleteRecurringUI → moved to ui-recurring.js


// openAnalyzer, closeAnalyzer, onStatementFileSelect, processStatementAI,
// confirmAnalyzerResults, analyzedTransactions → moved to ui-analyzer.js


/* ═══════════════════════════════════════════════
   ADVANCED ANALYTICS (ROADMAP PHASE 3)
═══════════════════════════════════════════════ */
// renderTrends, renderRadar, renderHeatmap, chartTrends, chartRadar → moved to ui-charts.js


async function logout() {
  if (!confirm("Are you sure you want to log out?")) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) flash(error.message, true);
  location.reload();
}



