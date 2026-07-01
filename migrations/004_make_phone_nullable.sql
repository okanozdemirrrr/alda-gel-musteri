-- customers.phone kolonunu nullable yap
-- Uygulama kayıt formunda telefon zorunlu değil, sonradan eklenebilir
ALTER TABLE customers
  ALTER COLUMN phone DROP NOT NULL;
