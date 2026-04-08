-- ============================================================
-- CUPONERA CAMSA — Migración v2
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Agregar campos de perfil extendido
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cargo        TEXT,
  ADD COLUMN IF NOT EXISTS foto_url     TEXT,
  ADD COLUMN IF NOT EXISTS fecha_ingreso DATE DEFAULT CURRENT_DATE;

-- Actualizar la función que crea perfiles automáticamente
-- para que también tome el campo 'cargo' del metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, apellido, email, rol, cargo, fecha_ingreso)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nombre'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'empleado'),
    NEW.raw_user_meta_data->>'cargo',
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
