-- Apple App Store 5.1.1 uyumluluğu için hesap silme fonksiyonu
-- Kullanıcı kendi auth kaydını silebilmesi için SECURITY DEFINER ile çalışır.
-- Supabase Dashboard > SQL Editor'da çalıştırın.

CREATE OR REPLACE FUNCTION delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid uuid;
BEGIN
  current_uid := auth.uid();

  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Kimlik doğrulama gerekli';
  END IF;

  -- customers tablosundaki kaydı sil (CASCADE ile ilişkili veriler de silinir)
  DELETE FROM public.customers WHERE id = current_uid;

  -- Supabase auth.users kaydını sil
  DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

-- Sadece kimliği doğrulanmış kullanıcılar çağırabilsin
REVOKE ALL ON FUNCTION delete_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_current_user() TO authenticated;
