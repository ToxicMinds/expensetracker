/* ═══════════════════════════════════════════════
   ui-settings.js — Settings Panel & Integrations
   Extracted from ui.js as part of Operation Modular.
   Depends on: state.js, utils.js, auth.js, ui-recurring.js
═══════════════════════════════════════════════ */

/* Render the Smart Rules list in settings */
function renderSettingsRules() {
  var el = document.getElementById('set-rules-list');
  if (!el) return;
  el.innerHTML = RULES.map(r =>
    `<div class="rule-row">
      <div class="rule-pat">"${esc(r.pattern)}"</div>
      <div class="rule-arr">→</div>
      <div class="rule-cat">${esc(r.category)}</div>
      <button class="db" onclick="deleteRule('${r.id}')">×</button>
    </div>`
  ).join('');
}

/* Render bank connections list in dashboard card and settings */
function renderBankSync() {
  var el    = document.getElementById('bank-sync-list');
  var bList = document.getElementById('bank-connections-list');
  if (!el) return;

  if (BANKS.length === 0) {
    el.innerHTML = '<div style="font-size:13px;color:var(--muted)">No banks connected. Open ⚙️ Settings → Bank Connections.</div>';
    if (bList) bList.innerHTML = '<div style="font-size:13px;color:var(--muted)">No banks connected.</div>';
    return;
  }

  el.innerHTML = BANKS.map(b =>
    `<div class="bank-item">
      <div class="bank-info">
        <div class="bank-name">${esc(b.name)}</div>
        <div class="bank-status ok">Connected • ${b.accounts.length} accounts</div>
      </div>
      <button class="db" onclick="syncBank('${b.requisition_id}')" title="Sync transactions">🔄</button>
    </div>`
  ).join('');

  if (bList) {
    bList.innerHTML = BANKS.map(b =>
      `<div class="bank-item">
        <div class="bank-info">
          <div class="bank-name">${esc(b.name)}</div>
          <div class="bank-status ok">Connected on ${b.linked_at}</div>
        </div>
      </div>`
    ).join('');
  }
}

/* Render the budget input grid in settings */
function renderBudgetsGrid() {
  var grid = document.getElementById('set-budgets-grid');
  if (!grid) return;
  grid.innerHTML = CATS.map(c =>
    `<div class="fg" style="margin-bottom:0">
      <div class="fl" style="display:flex;justify-content:space-between">
        <span>${esc(c)} (€)</span>
        <button onclick="delCategory('${esc(c)}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;line-height:1">&#x2715;</button>
      </div>
      <input type="number" id="bc_${c}" value="${BUDGETS[c] || 0}" min="0" step="1" data-cat="${esc(c)}">
    </div>`
  ).join('');
}

/* Open the bank picker modal */
function openBankPicker() {
  document.getElementById('bank-picker-modal').classList.add('open');
  loadBanks();
}

/* Google Calendar integration */
function connectGoogleCalendar() {
  window.location.href = '/api/google-calendar?action=auth';
}

function disconnectGoogleCalendar() {
  if (!confirm('Disconnect Google Calendar? Sync will stop.')) return;
  GCAL.enabled = false;
  GCAL.token   = null;
  localStorage.setItem('sf_gcal', JSON.stringify(GCAL));
  sbSaveState().catch(function() {});
  renderIntegrations();
}

async function syncToGCal(expense) {
  if (!GCAL || !GCAL.enabled || !GCAL.token) return;
  try {
    const res  = await fetch('/api/google-calendar?action=sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: GCAL.token, expense })
    });
    const data = await res.json();
    if (data.new_token) {
      GCAL.token = data.new_token;
      localStorage.setItem('sf_gcal', JSON.stringify(GCAL));
      sbSaveState().catch(function() {});
    }
  } catch (e) {
    console.error('GCal sync failed', e);
  }
}

async function syncAllToGCal() {
  if (!GCAL || !GCAL.enabled || !GCAL.token) {
    flash('Connect Google Calendar first', true);
    return;
  }
  if (!confirm(`Sync all ${expenses.length} expenses to your calendar?`)) return;

  const status = document.getElementById('gcal-status');
  status.textContent = 'Syncing... 0%';
  const toSync = [...expenses];
  let success = 0;

  for (let i = 0; i < toSync.length; i++) {
    await syncToGCal(toSync[i]);
    success++;
    status.textContent = `Syncing... ${Math.round((success / toSync.length) * 100)}%`;
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
  }

  status.textContent = 'Sync Complete!';
  flash(`Successfully pushed ${success} items to Calendar`, false);
  setTimeout(() => { status.textContent = ''; }, 5000);
}

/* Render the Google Calendar connect/disconnect button */
function renderIntegrations() {
  var btn = document.getElementById('btn-gcal-connect');
  if (!btn) return;
  if (GCAL && GCAL.enabled) {
    btn.textContent      = 'Connected (Disconnect)';
    btn.style.background = 'var(--bg)';
    btn.style.color      = 'var(--text)';
    btn.onclick          = disconnectGoogleCalendar;
  } else {
    btn.textContent      = 'Connect';
    btn.style.background = 'var(--nikhil-light)';
    btn.style.color      = 'var(--nikhil)';
    btn.onclick          = connectGoogleCalendar;
  }
}

/* Prompt the user for a new secure PIN */
async function promptChangePin() {
  const newPin = prompt("Enter a new 4-digit PIN for your household (numbers only):");
  if (!newPin) return;
  if (!/^\\d{4}$/.test(newPin)) {
    alert("PIN must be exactly 4 digits.");
    return;
  }
  
  if (confirm("Are you sure you want to change the PIN? Other members will need the new PIN to log in on new devices.")) {
    try {
      if (typeof setSyncing === 'function') setSyncing('s');
      await sbUpdateHouseholdPin(newPin);
      alert("PIN changed successfully!");
      if (typeof setSyncing === 'function') setSyncing('ok');
    } catch(e) {
      alert("Failed to change PIN: " + e.message);
      if (typeof setSyncing === 'function') setSyncing('e');
    }
  }
}

/* Open the settings/nav modal and populate all sections */
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

/* Close the settings/nav modal */
function closeSettings() {
  document.getElementById('nav-modal')?.classList.remove('open');
  document.getElementById('settings-modal')?.classList.remove('open');
}
