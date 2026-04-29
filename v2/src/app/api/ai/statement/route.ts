import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Statement text too short or empty' }, { status: 400 });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert financial data parser. 
Extract every valid transaction from the provided bank statement text.
Ignore running balances, header text, and page numbers.
Always respond with pure JSON containing a "transactions" array.
Format each item exactly like this:
{
  "date": "YYYY-MM-DD",
  "description": "Store or Merchant Name",
  "amount": 12.34,
  "category": "One of: Groceries, Food, Transport, Housing, Utilities, Health, Clothing, Entertainment, Savings, Adjustment, Other"
}
Only output the JSON object. Do not wrap in markdown blocks like \`\`\`json. Do not include any explanations.`
          },
          {
            role: "user",
            content: text.substring(0, 8000) // limit to avoid max tokens
          }
        ],
        temperature: 0.1,
      })
    });

    const aiData = await groqRes.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Clean up potential markdown formatting Groq might still add
    content = content.trim();
    if (content.startsWith('```json')) content = content.substring(7);
    if (content.startsWith('```')) content = content.substring(3);
    if (content.endsWith('```')) content = content.substring(0, content.length - 3);

    const parsed = JSON.parse(content);

    return NextResponse.json({ 
      success: true, 
      transactions: parsed.transactions || []
    });

  } catch (e: any) {
    console.error("Statement AI Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
