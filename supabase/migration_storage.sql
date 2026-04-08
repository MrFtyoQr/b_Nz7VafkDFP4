-- ============================================================
-- CUPONERA CAMSA — Storage bucket + policies
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Crear bucket público para fotos y comprobantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('cuponera-assets', 'cuponera-assets', true)
ON CONFLICT DO NOTHING;

-- 2. Policies de storage
DROP POLICY IF EXISTS "assets_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "assets_auth_upload"  ON storage.objects;
DROP POLICY IF EXISTS "assets_auth_delete"  ON storage.objects;

-- Cualquiera puede leer (bucket público = URLs directas funcionan)
CREATE POLICY "assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cuponera-assets');

-- Cualquier usuario autenticado puede subir archivos
CREATE POLICY "assets_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cuponera-assets');

-- Cada usuario solo puede borrar sus propios archivos
CREATE POLICY "assets_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cuponera-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
