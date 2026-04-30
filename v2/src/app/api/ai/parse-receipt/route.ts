import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(req: Request) {
  try {
    const { ekasaData, categories } = await req.json();

    if (!ekasaData) {
      return NextResponse.json({ error: 'Missing eKasa data' }, { status: 400 });
    }

    const systemPrompt = `
      You are an expert financial assistant for Synculariti Expense Tracker.
      Your task is to parse raw Slovak eKasa receipt data into a clean JSON format.
      
      RULES:
      1. Extract the Merchant Name (Store).
      2. Extract the Receipt Date (YYYY-MM-DD).
      3. For each item in the receipt:
         - Normalize the Slovak name (e.g., "Kup. sunka" -> "Šunka").
         - Assign a CATEGORY from this list: ${categories?.join(', ') || 'Groceries, Food, Transport, Shopping, Health, Utilities, Entertainment, Others'}.
         - Use "Groceries" for food items bought in supermarkets.
         - Use "Food" for restaurants/cafes.
      4. Ensure the total matches the sum of items.
      
      RETURN ONLY RAW JSON:
      {
        "store": "Merchant Name",
        "date": "YYYY-MM-DD",
        "total": 0.00,
        "items": [
          { "name": "Clean Item Name", "amount": 0.00, "category": "CategoryName" }
        ]
      }
    `;

    const userPrompt = `
      Parse this eKasa JSON:
      ${JSON.stringify(ekasaData, null, 2)}
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    console.error('Receipt AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
