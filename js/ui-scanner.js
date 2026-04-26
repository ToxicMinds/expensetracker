/* ═══════════════════════════════════════════════
   ui-scanner.js — Scanner & Receipt Review UI
   Extracted from ui.js as part of Operation Modular.
   Depends on: state.js, utils.js, api.js, app.js (confirmReview)
═══════════════════════════════════════════════ */

/* Parse a base64-encoded QR string and extract the eKasa receipt ID */
function checkEkasa(b64, mime) {
  var txt = '';
  try { txt = atob(b64); } catch(e) {}

  /* Standard eKasa O-XXXXXX... pattern */
  var m = txt.match(/O-[0-9A-F]{32}/i);
  if (m) return m[0];

  /* Specific SK Financna Sprava URL pattern */
  var mUrl = txt.match(/id=([0-9A-F]{32})/i) || txt.match(/O-[0-9A-F]{32}/i);
  if (mUrl && mUrl[1]) return 'O-' + mUrl[1];

  return null;
}

/* Open the scanner modal and start QR camera */
function openScanner() {
  document.getElementById('scan-modal').classList.add('open');
  document.getElementById('sdate').value = today();

  // Ensure the scanner user toggles are correctly rendered
  applyNamesUI();

  showStep('step-qr');
  startQRCamera();
}

/* Close the scanner modal and stop the camera */
function closeScanner() {
  stopQRCamera();
  document.getElementById('scan-modal').classList.remove('open');
}

/* Activate a step panel within the scanner modal */
function showStep(id) {
  document.querySelectorAll('.step').forEach(function(s) { s.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
  else dbg('UI Warning: step not found: ' + id, true);
}

/* Render an eKasa status message (info, success, error) */
function showEkasaStatus(type, title, desc) {
  var b = document.getElementById('ekasa-status');
  if (!b) return;
  b.className = 'status-box ' + type;
  b.innerHTML = '<div class="sb-title">' + esc(title) + '</div><div>' + esc(desc) + '</div>';
  if (type === 'info') {
    b.insertAdjacentHTML('afterbegin', '<div style="text-align:center;margin-bottom:10px"><span class="spin"></span></div>');
  }
}

/* Populate the receipt review step with categorised line items */
function showReview(store, dateStr, items, totalInput) {
  showStep('step-review');

  var storeEl = document.getElementById('r-store');
  if (storeEl) storeEl.textContent = store;

  var dateEl = document.getElementById('sdate');
  if (dateEl) dateEl.value = dateStr || today();

  var totalEl = document.getElementById('r-total');
  if (totalEl) totalEl.textContent = totalInput ? 'Total: €' + fmt(totalInput) : 'Total: Auto';

  var list = document.getElementById('r-items');
  if (!list) return;

  if (!items || !items.length) {
    list.innerHTML = '<div class="te" style="padding:20px;color:var(--muted)">No items extracted.</div>';
    return;
  }

  list.innerHTML = items.map(function(it, i) {
    var catOpts = getCategoryOptions(it.category);
    return `<div class="pitem">` +
      `<input type="checkbox" id="rcb_${i}" checked style="width:20px;height:20px">` +
      `<div class="pinm" style="flex:1;font-size:13px">${esc(it.name)}</div>` +
      `<div class="picat"><select id="rcat_${i}" style="font-size:11px;padding:2px">${catOpts}</select></div>` +
      `<div class="piam" style="font-family:var(--mono);width:60px;text-align:right">€${fmt(it.amount)}` +
      `<input type="hidden" id="ramt_${i}" value="${it.amount}">` +
      `</div>` +
      `<input type="hidden" id="rnm_${i}" value="${esc(it.name)}">` +
      `</div>`;
  }).join('');
}

/* Cancel the review and close the scanner */
function cancelReview() { closeScanner(); }
