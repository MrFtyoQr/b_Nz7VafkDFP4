-- ============================================================
-- CUPONERA CAMSA — Migración v3
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Dirección en empresas
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS direccion TEXT;

-- 2. Opciones de reembolso en beneficios
ALTER TABLE public.benefits
  ADD COLUMN IF NOT EXISTS requiere_comprobante  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS porcentaje_reembolso  INTEGER  DEFAULT NULL
    CHECK (porcentaje_reembolso IS NULL OR (porcentaje_reembolso >= 0 AND porcentaje_reembolso <= 100));

-- 3. Comprobante y estado en asignaciones
ALTER TABLE public.user_benefits
  ADD COLUMN IF NOT EXISTS comprobante_url    TEXT,
  ADD COLUMN IF NOT EXISTS comprobante_estado TEXT DEFAULT NULL
    CHECK (comprobante_estado IS NULL OR comprobante_estado IN ('pendiente','aprobado','rechazado')),
  ADD COLUMN IF NOT EXISTS notas_admin        TEXT;

-- 4. Storage bucket para archivos (ejecutar por separado si da error de permisos)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('cuponera-assets', 'cuponera-assets', true)
-- ON CONFLICT DO NOTHING;

-- 5. Policies de storage (ejecutar después de crear el bucket)
-- DROP POLICY IF EXISTS "assets_public_read"  ON storage.objects;
-- DROP POLICY IF EXISTS "assets_auth_upload"  ON storage.objects;
-- DROP POLICY IF EXISTS "assets_auth_delete"  ON storage.objects;
--
-- CREATE POLICY "assets_public_read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'cuponera-assets');
--
-- CREATE POLICY "assets_auth_upload"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'cuponera-assets');
--
-- CREATE POLICY "assets_auth_delete"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'cuponera-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. RLS: empleado puede actualizar su propio comprobante (solo si el beneficio lo requiere)
DROP POLICY IF EXISTS "user_benefits_upload_comprobante" ON public.user_benefits;
CREATE POLICY "user_benefits_upload_comprobante"
  ON public.user_benefits FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND estatus = 'activo')
  WITH CHECK (user_id = auth.uid());
-- Nota: los updates sensibles (approve/reject) siguen yendo por service_role en API routes
