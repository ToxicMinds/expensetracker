/**
 * Serverless function to securely provide Supabase Environment Variables to the frontend.
 * This prevents hardcoding sensitive keys in the client source code.
 */
export default function handler(req, res) {
  // Use Vercel's standard environment variable names or our custom ones
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!sbUrl || !sbKey) {
    return res.status(500).json({ 
      error: "Supabase Environment Variables are not configured in Vercel settings.",
      help: "Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set for the Preview/Production environments."
    });
  }

  res.status(200).json({
    SB_URL: sbUrl,
    SB_KEY: sbKey
  });
}
