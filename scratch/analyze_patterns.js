const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function analyze() {
  const { data: expenses } = await supabase.from('expenses').select('*');
  
  if (!expenses) return;

  const vendors = {};
  const categories = {};
  
  expenses.forEach(e => {
    const desc = (e.description || '').toUpperCase();
    vendors[desc] = (vendors[desc] || 0) + 1;
    categories[e.category] = (categories[e.category] || 0) + 1;
  });

  const topVendors = Object.entries(vendors).sort((a,b) => b[1] - a[1]).slice(0, 10);
  const topCategories = Object.entries(categories).sort((a,b) => b[1] - a[1]).slice(0, 10);

  console.log('--- Top Vendors ---');
  topVendors.forEach(([v, c]) => console.log(`${v}: ${c} entries`));
  
  console.log('\n--- Top Categories ---');
  topCategories.forEach(([cat, c]) => console.log(`${cat}: ${c} entries`));
}

analyze();
