/**
 * UTILS.JS
 * Pure utility functions with zero dependencies.
 */

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmt(n) {
  return Number(n).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s) {
  if (!s) return "";
  const p = String(s).split("-");
  if (p.length !== 3) return s;
  return `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
}

function today() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function uid() {
  return 'ex_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function setSyncing(st) {
  var d = document.getElementById('sdot'), l = document.getElementById('slbl');
  if (!d || !l) return;
  if (st === 's') { d.className = 'dot s'; l.textContent = 'syncing'; }
  else if (st === 'e') { d.className = 'dot e'; l.textContent = 'error'; }
  else { d.className = 'dot'; l.textContent = 'live'; }
}

function flash(msg, isErr) {
  var f = document.getElementById('flash');
  if (!f) return;
  f.textContent = msg;
  f.style.color = isErr ? 'var(--danger)' : 'var(--accent)';
  setTimeout(function () { f.textContent = ''; }, 4000);
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Toggles the 'flipped' state of a card.
 */
function toggleCardFlip(btn) {
  const cardContainer = btn.closest('.card-container');
  if (cardContainer) {
    cardContainer.classList.toggle('flipped');
  }
}
