  -- ============================================================
  -- CUPONERA CAMSA — Schema completo de Supabase (PostgreSQL)
  -- Ejecutar en: Supabase Dashboard → SQL Editor → New query
  -- ============================================================

  -- ============================================================
  -- 1. EXTENSIONES
  -- ============================================================
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- ============================================================
  -- 2. TABLAS
  -- ============================================================

  -- Perfiles de usuario (extiende auth.users de Supabase)
  CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre      TEXT NOT NULL,
    apellido    TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    rol         TEXT NOT NULL DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Empresas con convenio
  CREATE TABLE IF NOT EXISTS public.companies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      TEXT NOT NULL,
    logo_url    TEXT,
    categoria   TEXT NOT NULL CHECK (categoria IN (
                  'salud','entretenimiento','alimentacion',
                  'fitness','educacion','servicios','tecnologia','otros'
                )),
    descripcion TEXT,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin    DATE,
    activo       BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Beneficios / Cupones
  CREATE TABLE IF NOT EXISTS public.benefits (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo            TEXT NOT NULL,
    descripcion       TEXT,
    tipo              TEXT NOT NULL CHECK (tipo IN ('descuento','pago_cubierto','informativo')),
    valor             TEXT,
    imagen_url        TEXT,
    company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    fecha_vencimiento DATE,
    activo            BOOLEAN NOT NULL DEFAULT true,
    asignado_a        TEXT NOT NULL DEFAULT 'individual' CHECK (asignado_a IN ('individual','grupo','todos')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Asignaciones de beneficios a empleados
  CREATE TABLE IF NOT EXISTS public.user_benefits (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    benefit_id            UUID NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
    estatus               TEXT NOT NULL DEFAULT 'activo' CHECK (estatus IN ('activo','usado','vencido','desactivado')),
    fecha_asignacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_uso             TIMESTAMPTZ,
    reportado_por_usuario BOOLEAN NOT NULL DEFAULT false,
    notas                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, benefit_id)
  );

  -- ============================================================
  -- 3. ÍNDICES
  -- ============================================================
  CREATE INDEX IF NOT EXISTS idx_profiles_rol        ON public.profiles(rol);
  CREATE INDEX IF NOT EXISTS idx_profiles_activo     ON public.profiles(activo);
  CREATE INDEX IF NOT EXISTS idx_companies_activo    ON public.companies(activo);
  CREATE INDEX IF NOT EXISTS idx_benefits_company    ON public.benefits(company_id);
  CREATE INDEX IF NOT EXISTS idx_benefits_activo     ON public.benefits(activo);
  CREATE INDEX IF NOT EXISTS idx_user_benefits_user  ON public.user_benefits(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_benefits_status ON public.user_benefits(estatus);
  CREATE INDEX IF NOT EXISTS idx_user_benefits_uso   ON public.user_benefits(fecha_uso);

  -- ============================================================
  -- 4. FUNCIÓN: actualiza updated_at automáticamente
  -- ============================================================
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Triggers para updated_at
  CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  CREATE TRIGGER trg_benefits_updated_at
    BEFORE UPDATE ON public.benefits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  CREATE TRIGGER trg_user_benefits_updated_at
    BEFORE UPDATE ON public.user_benefits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

  -- ============================================================
  -- 5. FUNCIÓN: crea perfil automáticamente al registrar usuario
  -- ============================================================
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, nombre, apellido, email, rol)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin'),
      COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nombre'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'rol', 'empleado')
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  -- ============================================================
  -- 6. FUNCIÓN: vencer cupones expirados (llamar con cron o manualmente)
  -- ============================================================
  CREATE OR REPLACE FUNCTION public.expire_overdue_benefits()
  RETURNS void AS $$
  BEGIN
    UPDATE public.user_benefits ub
    SET estatus = 'vencido', updated_at = NOW()
    FROM public.benefits b
    WHERE ub.benefit_id = b.id
      AND ub.estatus = 'activo'
      AND b.fecha_vencimiento IS NOT NULL
      AND b.fecha_vencimiento < CURRENT_DATE;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- ============================================================
  -- 7. ROW LEVEL SECURITY (RLS)
  -- ============================================================

  ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.companies     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.benefits      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_benefits ENABLE ROW LEVEL SECURITY;

  -- --- PROFILES ---

  -- Cualquier usuario autenticado puede leer su propio perfil
  CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

  -- Admin puede leer todos los perfiles
  CREATE POLICY "profiles_select_admin"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.rol = 'admin'
      )
    );

  -- Solo el backend (service_role) puede crear/editar/borrar perfiles
  -- (Los inserts por trigger usan SECURITY DEFINER, por eso no necesitan policy de INSERT)
  CREATE POLICY "profiles_insert_service"
    ON public.profiles FOR INSERT
    TO service_role
    WITH CHECK (true);

  CREATE POLICY "profiles_update_service"
    ON public.profiles FOR UPDATE
    TO service_role
    USING (true);

  CREATE POLICY "profiles_delete_service"
    ON public.profiles FOR DELETE
    TO service_role
    USING (true);

  -- Un empleado puede actualizar solo su propio perfil (campos no sensibles)
  CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND rol = (SELECT rol FROM public.profiles WHERE id = auth.uid()));

  -- --- COMPANIES ---

  -- Todos los autenticados pueden leer empresas activas
  CREATE POLICY "companies_select_authenticated"
    ON public.companies FOR SELECT
    TO authenticated
    USING (true);

  -- Solo service_role (backend) puede crear/editar/borrar empresas
  CREATE POLICY "companies_insert_service"
    ON public.companies FOR INSERT
    TO service_role
    WITH CHECK (true);

  CREATE POLICY "companies_update_service"
    ON public.companies FOR UPDATE
    TO service_role
    USING (true);

  CREATE POLICY "companies_delete_service"
    ON public.companies FOR DELETE
    TO service_role
    USING (true);

  -- Admin también puede modificar (para operaciones desde servidor Next.js con service_role)
  -- Nota: el frontend admin SIEMPRE usará la service_role key vía API routes del servidor

  -- --- BENEFITS ---

  -- Todos los autenticados pueden leer beneficios activos
  CREATE POLICY "benefits_select_authenticated"
    ON public.benefits FOR SELECT
    TO authenticated
    USING (true);

  -- Solo service_role puede crear/editar/borrar beneficios
  CREATE POLICY "benefits_insert_service"
    ON public.benefits FOR INSERT
    TO service_role
    WITH CHECK (true);

  CREATE POLICY "benefits_update_service"
    ON public.benefits FOR UPDATE
    TO service_role
    USING (true);

  CREATE POLICY "benefits_delete_service"
    ON public.benefits FOR DELETE
    TO service_role
    USING (true);

  -- --- USER_BENEFITS ---

  -- Empleado solo ve SUS propios cupones
  CREATE POLICY "user_benefits_select_own"
    ON public.user_benefits FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

  -- Admin ve todos los cupones
  CREATE POLICY "user_benefits_select_admin"
    ON public.user_benefits FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.rol = 'admin'
      )
    );

  -- Solo service_role puede asignar (INSERT) cupones a empleados
  CREATE POLICY "user_benefits_insert_service"
    ON public.user_benefits FOR INSERT
    TO service_role
    WITH CHECK (true);

  -- El empleado SOLO puede marcar como "usado" su propio cupón activo (desde API route verificada)
  -- Usamos service_role en el API route del servidor para hacer el UPDATE
  CREATE POLICY "user_benefits_update_service"
    ON public.user_benefits FOR UPDATE
    TO service_role
    USING (true);

  -- Solo service_role puede borrar
  CREATE POLICY "user_benefits_delete_service"
    ON public.user_benefits FOR DELETE
    TO service_role
    USING (true);

  -- ============================================================
  -- 8. STORAGE (Bucket para logos e imágenes)
  -- ============================================================

  -- Ejecutar SOLO si no existe el bucket aún:
  -- INSERT INTO storage.buckets (id, name, public)
  -- VALUES ('cuponera-assets', 'cuponera-assets', true)
  -- ON CONFLICT DO NOTHING;

  -- Policy para que cualquiera pueda leer imágenes (público)
  -- CREATE POLICY "assets_public_read"
  --   ON storage.objects FOR SELECT
  --   USING (bucket_id = 'cuponera-assets');

  -- Policy para que solo admins/service_role suban imágenes
  -- CREATE POLICY "assets_admin_upload"
  --   ON storage.objects FOR INSERT
  --   TO service_role
  --   WITH CHECK (bucket_id = 'cuponera-assets');

  -- ============================================================
  -- 9. DATOS INICIALES (Admin por defecto)
  -- ============================================================
  -- IMPORTANTE: Primero crea el usuario en Supabase Auth Dashboard,
  -- luego ejecuta este INSERT para asignarle rol admin:
  --
  -- UPDATE public.profiles
  -- SET rol = 'admin'
  -- WHERE email = 'admin@camsa.com.mx';

  -- ============================================================
  -- FIN DEL SCHEMA
  -- ============================================================
