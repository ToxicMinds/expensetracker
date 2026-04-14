/* ═══════════════════════════════════════════════
   Vercel Function: api/gocardless.js
   Proxy for GoCardless Bank Account Data API.

   Required environment variables (set in Vercel Dashboard):
     GOCARDLESS_SECRET_ID 
     GOCARDLESS_SECRET_KEY 
═══════════════════════════════════════════════ */
const BASE = 'https://bankaccountdata.gocardless.com/api/v2';

async function getAccessToken() {
  const r = await fetch(BASE + '/token/new/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      secret_id:  process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY
    })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail || d.summary || 'GoCardless auth failed');
  return d.access;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GOCARDLESS_SECRET_ID) {
    return res.status(500).json({ error: 'GOCARDLESS_SECRET_ID not configured in Vercel.' });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { action, ...params } = payload;

  try {
    const token = await getAccessToken();
    let url, method = 'GET', body = undefined;

    switch (action) {
      case 'institutions':
        url = BASE + '/institutions/?country=' + (params.country || 'SK');
        break;

      case 'create_requisition':
        url = BASE + '/requisitions/';
        method = 'POST';
        body = JSON.stringify({
          redirect:       params.redirect_uri,
          institution_id: params.institution_id,
          reference:      params.reference || ('ET-' + Date.now()),
          user_language:  'EN'
        });
        break;

      case 'get_requisition':
        url = BASE + '/requisitions/' + params.requisition_id + '/';
        break;

      case 'get_transactions':
        url = BASE + '/accounts/' + params.account_id + '/transactions/';
        if (params.date_from) url += '?date_from=' + params.date_from;
        break;

      case 'get_balances':
        url = BASE + '/accounts/' + params.account_id + '/balances/';
        break;

      case 'get_account_details':
        url = BASE + '/accounts/' + params.account_id + '/details/';
        break;

      default:
        return res.status(400).json({ error: 'Unknown action: ' + action });
    }

    const r = await fetch(url, {
      method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body
    });
    
    const text = await r.text();
    try {
      res.status(r.status).json(JSON.parse(text));
    } catch(err) {
      res.status(r.status).send(text);
    }

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
