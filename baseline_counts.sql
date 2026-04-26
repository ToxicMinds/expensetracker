SELECT 'expenses' as name, COUNT(*) as count FROM public.expenses
UNION ALL
SELECT 'households', COUNT(*) FROM public.households
UNION ALL
SELECT 'app_users', COUNT(*) FROM public.app_users;
