/* ═══════════════════════════════════════════════
   ui-analyzer.js — AI Statement Analyzer UI
   Extracted from ui.js as part of Operation Modular.
   Depends on: state.js, utils.js, api.js
═══════════════════════════════════════════════ */

let analyzedTransactions = [];

function openAnalyzer() {
  document.getElementById('analyzer-modal').classList.add('open');
}

function closeAnalyzer() {
  document.getElementById('analyzer-modal').classList.remove('open');
  document.getElementById('analyzer-results').style.display = 'none';
  document.getElementById('analyzer-input').value = '';
}

function onStatementFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById('analyzer-input').value = evt.target.result;
    flash('File loaded into analyzer!');
  };
  reader.readAsText(file);
}

async function processStatementAI() {
  const text = document.getElementById('analyzer-input').value.trim();
  if (!text) { flash('Please paste transactions or upload a file', true); return; }

  const btn = document.getElementById('lbl-btn-analyze');
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span> Analyzing...';

  try {
    analyzedTransactions = await aiProcessBulkTransactions(text);
    document.getElementById('analyzer-results').style.display = 'block';
    const list = document.getElementById('analyzer-list');
    list.innerHTML = analyzedTransactions.map((tx, idx) => `
      <div class="pitem">
        <input type="checkbox" checked id="ana-${idx}">
        <div class="pinm">
          <strong>${esc(tx.description)}</strong><br>
          <small>${esc(tx.date)} | ${esc(tx.who)}</small>
        </div>
        <div class="piam">€${tx.amount}</div>
        <div class="picat">
          <select id="ana-cat-${idx}">
            ${CATS.map(c => `<option ${c === tx.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
        </div>
      </div>
    `).join('');
  } catch (e) {
    flash('AI Analysis failed: ' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analyze with Groq AI';
  }
}

async function confirmAnalyzerResults() {
  const toSave = [];
  analyzedTransactions.forEach((tx, idx) => {
    if (document.getElementById(`ana-${idx}`).checked) {
      tx.category = document.getElementById(`ana-cat-${idx}`).value;
      toSave.push(tx);
    }
  });

  if (toSave.length === 0) return;

  flash(`Importing ${toSave.length} transactions...`);
  for (const tx of toSave) {
    await sbInsert(tx);
  }

  closeAnalyzer();
  renderAll();
  flash('Successfully imported all verified transactions!', false);
}
