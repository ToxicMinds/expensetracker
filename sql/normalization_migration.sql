-- 1. Ensure columns exist first
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS who_id TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS cat_id TEXT;
ALTER TABLE public.recurring_expenses ADD COLUMN IF NOT EXISTS who_id TEXT;
ALTER TABLE public.recurring_expenses ADD COLUMN IF NOT EXISTS cat_id TEXT;

-- 2. Run the scoped migration
DO $$ 
DECLARE
  target_house_id UUID := 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'; 
BEGIN
  -- Map Nik/Nikhil to u1 (Scoped to household)
  UPDATE public.expenses SET who_id = 'u1' 
  WHERE (who = 'Nik' OR who = 'Nikhil') AND household_id = target_house_id;
  
  -- Map Zuzana to u2 (Scoped to household)
  UPDATE public.expenses SET who_id = 'u2' 
  WHERE who = 'Zuzana' AND household_id = target_house_id;

  -- Repeat for recurring (Scoped to household)
  UPDATE public.recurring_expenses SET who_id = 'u1' 
  WHERE (who = 'Nik' OR who = 'Nikhil') AND household_id = target_house_id;
  
  UPDATE public.recurring_expenses SET who_id = 'u2' 
  WHERE who = 'Zuzana' AND household_id = target_house_id;

  -- Map Categories to stable IDs (Scoped to household)
  UPDATE public.expenses SET cat_id = 'c1' WHERE category = 'Groceries' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c2' WHERE category = 'Clothing' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c3' WHERE category = 'Transport' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c4' WHERE category = 'Utilities' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c5' WHERE category = 'Dining out' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c6' WHERE category = 'Health' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c7' WHERE category = 'Entertainment' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c8' WHERE category = 'Pets' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c9' WHERE category = 'Kids' AND household_id = target_house_id;
  UPDATE public.expenses SET cat_id = 'c10' WHERE category = 'Other' AND household_id = target_house_id;

  -- Fallback for any custom categories
  UPDATE public.expenses SET cat_id = 'c_custom_' || category 
  WHERE cat_id IS NULL AND household_id = target_house_id;
  
  UPDATE public.recurring_expenses SET cat_id = 'c_custom_' || category 
  WHERE cat_id IS NULL AND household_id = target_house_id;
END $$;

-- 3. Verification Query (Scoped)
SELECT who_id, who, cat_id, category, COUNT(*) 
FROM expenses 
WHERE household_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
GROUP BY who_id, who, cat_id, category;
