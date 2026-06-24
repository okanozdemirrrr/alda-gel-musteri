-- Adres tarifi (kurye notu) için ayrı sütun
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS directions text;
