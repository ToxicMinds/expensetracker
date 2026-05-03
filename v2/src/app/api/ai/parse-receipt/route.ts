import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ekasaData, categories } = await req.json();

    if (!ekasaData) {
      return NextResponse.json({ error: 'Missing eKasa data' }, { status: 400 });
    }

    // 1. EXTRACT GROUND TRUTH FROM EKASA JSON (DO NOT LET AI TOUCH FINANCIALS)
    const receipt = ekasaData.receipt || ekasaData.data || ekasaData;
    
    const cleanStoreName = (name: string) => {
      if (!name || name === 'Slovak Receipt') return name;
      return name
        .replace(/,?\s*(s\.r\.o\.|v\.o\.s\.|a\.s\.|k\.s\.|o\.z\.)/gi, '')
        .replace(/Slovenská republika/gi, '')
        .trim();
    };

    const store = cleanStoreName(
      receipt.organizationName || 
      receipt.merchantName || 
      receipt.name || 
      ekasaData.organizationName || 
      'Slovak Receipt'
    );
    
    // Improved Date Extraction
    let date = null;
    const rawDate = String(receipt.createDate || receipt.issueDate || receipt.date || '');
    
    // Try YYYY-MM-DD (ISO)
    const isoMatch = rawDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    } else {
      // Try DD.MM.YYYY (Slovak common)
      const skMatch = rawDate.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (skMatch) {
        date = `${skMatch[3]}-${skMatch[2]}-${skMatch[1]}`;
      }
    }

    const rawItems = receipt.items || receipt.receiptItems || receipt.lines || [];
    const items = rawItems.map((it: any) => ({
      originalName: it.name || it.itemName || it.description || 'Unknown Item',
      amount: Number(it.itemTotalPrice || it.lineTotal || it.price || it.amount || 0)
    }));

    const total = Number(receipt.totalPrice || receipt.total || items.reduce((acc: number, curr: any) => acc + curr.amount, 0));

    // 2. ASK AI FOR CATEGORIZATION AND STORE INFERENCE (IF NEEDED)
    const needsStoreInference = store === 'Slovak Receipt';
    const systemPrompt = `
      You are a specialized financial analyst.
      I will provide a list of items from a Slovak receipt.
      ${needsStoreInference ? 'EXTRACT THE STORE NAME from these items (e.g., Lidl, Tesco, Billa, Shell, Pharmacy).' : ''}
      Normalize item names (e.g., "Kup. sunka 100g" -> "Šunka").
      Assign a CATEGORY from this list: ${categories?.join(', ') || 'Groceries, Dining Out, Transport, Other'}.
      
      RETURN JSON:
      {
        ${needsStoreInference ? '"inferredStore": "Store Name",' : ''}
        "items": [
          { "name": "Normalized Name", "category": "Category" }
        ]
      }
    `;

    const userPrompt = `Analyze these items: ${items.map((i: any) => i.originalName).join(', ')}`;

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

    const aiParsed = JSON.parse(content);
    const aiItems = aiParsed.items || [];
    const finalStore = (needsStoreInference && aiParsed.inferredStore) 
      ? cleanStoreName(aiParsed.inferredStore) 
      : store;

    // 3. MERGE AI CATEGORIES WITH ORIGINAL PRICES (GROUND TRUTH)
    const mergedItems = items.map((orig: any, idx: number) => ({
      name: aiItems[idx]?.name || orig.originalName,
      amount: orig.amount,
      category: aiItems[idx]?.category || 'Others'
    }));

    return NextResponse.json({
      store: finalStore,
      date,
      total,
      items: mergedItems
    });

  } catch (error: any) {
    console.error('Receipt AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
