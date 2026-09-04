-- Stop seeding demo/sample financial data. bootstrap_account now only ensures
-- a profile row and the default reusable sources exist.
CREATE OR REPLACE FUNCTION public.bootstrap_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profiles (user_id)
  VALUES (uid)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sources (user_id, name)
  SELECT uid, s
  FROM unnest(ARRAY['ব্যাংক', 'কুষ্টিয়া অফিস', 'ক্যাশ', 'অন্যান্য']) AS s
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_account() TO authenticated;
