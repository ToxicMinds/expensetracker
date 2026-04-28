import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getNeo4jDriver } from '@/lib/neo4j';

/**
 * DEBUG API: Syncs your HOUSEHOLD history to Neo4j.
 * Now restricted to your specific household for privacy.
 */
export async function GET(req: Request) {
  const driver = getNeo4jDriver();
  if (!driver) return NextResponse.json({ error: 'Neo4j not configured' }, { status: 500 });

  try {
    // 1. Identify the user's household (Security)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userMapping } = await supabase
      .from('app_users')
      .select('household_id')
      .eq('id', session.user.id)
      .single();

    if (!userMapping?.household_id) return NextResponse.json({ error: 'No household found' }, { status: 404 });
    const hid = userMapping.household_id;

    // 2. Fetch only THIS household's expenses
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('household_id', hid)
      .eq('is_deleted', false);

    if (error) throw error;

    const sessionNeo = driver.session();
    let syncCount = 0;

    try {
      await sessionNeo.executeWrite(async (tx) => {
        for (const exp of expenses) {
          const rawName = exp.description || 'Unknown Merchant';
          
          await tx.run(`
            MERGE (m:Merchant {name: $rawName})
            
            // Smart Case-Insensitive Branding
            WITH m
            CALL {
              WITH m
              UNWIND ['Lidl', 'Tesco', 'Amazon', 'Shell', 'Starbucks', 'Bolt', 'Wolt', 'McDonalds'] AS brandName
              WITH m, brandName
              WHERE m.name =~ ('(?i).*'+brandName+'.*') // Regex for case-insensitive contains
              MERGE (b:Brand {name: brandName})
              MERGE (m)-[:BELONGS_TO]->(b)
              RETURN count(b) AS branded
            }
            
            CREATE (t:Transaction {
              id: $id, 
              amount: $amount, 
              date: $date,
              category: $category
            })
            MERGE (m)-[:PROCESSED]->(t)
          `, {
            rawName,
            id: exp.id,
            amount: Number(exp.amount),
            date: exp.date,
            category: exp.category
          });
          syncCount++;
        }
      });
    } finally {
      await sessionNeo.close();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Privacy-Safe Sync: ${syncCount} transactions synced for your household.`,
      tip: 'Go to Neo4j and run: MATCH (b:Brand)<-[:BELONGS_TO]-(m:Merchant) RETURN b,m'
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
