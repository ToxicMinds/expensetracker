/**
 * Proxy for Google Calendar API
 */
module.exports = async (req, res) => {
  const { action, code } = req.query;

  const clientId = process.env.GCAL_CLIENT_ID;
  const clientSecret = process.env.GCAL_CLIENT_SECRET;
  
  // Dynamic host injection for redirect URI
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `${protocol}://${host}/api/google-calendar?action=callback`;

  // --- FALLBACK MOCK MODE ---
  // If the user hasn't configured Vercel Env Vars yet, safely simulate it
  if (!clientId || !clientSecret) {
    if (action === 'auth') {
      return res.redirect('/api/google-calendar?action=callback&code=simulated_auth_code_from_google');
    }
    if (action === 'callback' && code) {
      const simulated_token = "oauth2_refresh_token_" + Math.random().toString(36).substring(7);
      return res.redirect('/?gcal_success=true&token=' + simulated_token);
    }
  }

  // --- REAL PRODUCTION MODE ---

  if (action === 'auth') {
    // Generate auth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent'
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  if (action === 'callback' && code) {
    try {
      // Exchange code for token securely on the server
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });
      const tokenData = await tokenRes.json();
      
      if (tokenData.error) {
        return res.redirect('/?gcal_error=' + encodeURIComponent(tokenData.error_description || tokenData.error));
      }
      
      // Pass the token back to the frontend
      const tokenToSave = tokenData.refresh_token || tokenData.access_token;
      return res.redirect(`/?gcal_success=true&token=${encodeURIComponent(tokenToSave)}`);
    } catch (e) {
      return res.redirect('/?gcal_error=Token_Exchange_Failed');
    }
  }

  if (action === 'sync') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { token, expense } = req.body;
    if (!token || !expense) return res.status(400).json({ error: 'Missing token or expense data' });

    try {
      // 1. Get a fresh access token if the provided token is a refresh token or just use it.
      // (Google usually gives a refresh token only on first prompt).
      // For simplicity in this vanilla implementation, we'll try to use it as an access token first.
      
      const event = {
        summary: `Expense: ${expense.description || expense.category}`,
        description: `Category: ${expense.category}\nAmount: €${expense.amount}\nAdded via ET Expense Tracker`,
        start: { date: expense.date },
        end: { date: expense.date },
        colorId: '1' // Lavender
      };

      const googleRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      const data = await googleRes.json();
      
      if (!googleRes.ok) {
        // If 401, maybe we need to refresh (if user provided a refresh token)?
        if (googleRes.status === 401 && clientId && clientSecret) {
           const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
             method: 'POST',
             headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
             body: new URLSearchParams({
               client_id: clientId,
               client_secret: clientSecret,
               refresh_token: token,
               grant_type: 'refresh_token'
             })
           });
           const refreshData = await refreshRes.json();
           if (refreshRes.ok && refreshData.access_token) {
              // Retry with new token
              const retryRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${refreshData.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
              });
              const retryData = await retryRes.json();
              return res.status(retryRes.status).json({ ...retryData, new_token: refreshData.access_token });
           }
        }
        return res.status(googleRes.status).json(data);
      }

      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(400).json({ error: 'Unknown action' });
};
