/* ═══════════════════════════════════════════════
   ui-recurring.js — Recurring Bills UI
   Extracted from ui.js as part of Operation Modular.
   Depends on: state.js, utils.js, logic-recurring.js
═══════════════════════════════════════════════ */

/* Render the recurring bills list in settings */
async function renderRecurring() {
  const list = document.getElementById('set-recurring-list');
  if (!list) return;
  list.innerHTML = '<span class="spin"></span>';

  const recs = await sbSelectRecurring();
  if (recs.length === 0) {
    list.innerHTML = '<div style="font-size:12px; color:var(--muted)">No recurring bills added.</div>';
    return;
  }

  list.innerHTML = recs.map(r => `
    <div class="bank-item">
      <div class="bank-info">
        <div class="bank-name">${esc(r.name)}</div>
        <div class="bank-status">€${r.amount} - ${esc(r.category)} - Day ${r.day_of_month} (${esc(r.who)})</div>
      </div>
      <button class="db db-del" onclick="deleteRecurringUI('${r.id}')">&times;</button>
    </div>
  `).join('');
}

/* Add a new recurring bill via prompt flow */
async function addRecurringUI() {
  const name = prompt('Bill Name (e.g. Netflix):');
  if (!name) return;
  const amt = prompt('Amount (€):', '15.00');
  const cat = prompt('Category:', 'Entertainment');
  const day = prompt('Day of Month (1-31):', '1');
  const who = prompt('Who pays? (e.g. Nik):', NAMES.u1 || 'You');

  try {
    await sbSaveRecurring({ name, amount: parseFloat(amt), category: cat, day_of_month: parseInt(day), who });
    renderRecurring();
    renderCards();
  } catch (e) {
    flash('Failed to save recurring bill', true);
  }
}

/* Delete a recurring bill by ID */
async function deleteRecurringUI(id) {
  if (!confirm('Delete this recurring bill?')) return;
  await sbDeleteRecurring(id);
  renderRecurring();
  renderCards();
}
