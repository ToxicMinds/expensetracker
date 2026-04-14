/* ═══════════════════════════════════════════════
   Vercel Function: api/groq.js
   Proxy for Groq API (Protects GROQ_API_KEY)

   Required environment variables (set in Vercel Dashboard):
     GROQ_API_KEY
═══════════════════════════════════════════════ */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: { message: 'GROQ_API_KEY not configured in Vercel.' } });
  }

  try {
    const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    // We send back raw text/JSON depending on response
    const text = await r.text();
    try {
      res.status(r.status).json(JSON.parse(text));
    } catch(err) {
      res.status(r.status).send(text);
    }

  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
