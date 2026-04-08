-- Cuponera CAMSA Database Schema
-- This script creates all necessary tables for the corporate benefits platform

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies with agreements
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  logo_url TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('salud', 'entretenimiento', 'alimentacion', 'fitness', 'educacion', 'servicios', 'tecnologia', 'otros')),
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benefits/Coupons
CREATE TABLE IF NOT EXISTS public.benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('descuento', 'pago_cubierto', 'informativo')),
  valor TEXT, -- Could be percentage, amount, or descriptive text
  imagen_url TEXT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  fecha_vencimiento DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  asignado_a TEXT NOT NULL DEFAULT 'todos' CHECK (asignado_a IN ('individual', 'grupo', 'todos')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Benefits assignments (which coupon is assigned to which employee)
CREATE TABLE IF NOT EXISTS public.user_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
  estatus TEXT NOT NULL DEFAULT 'activo' CHECK (estatus IN ('activo', 'usado', 'vencido', 'desactivado')),
  fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_uso TIMESTAMP WITH TIME ZONE,
  reportado_por_usuario BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, benefit_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "profiles_insert_admin" ON public.profiles 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON public.profiles 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- RLS Policies for companies (everyone can read, only admin can modify)
CREATE POLICY "companies_select_all" ON public.companies 
  FOR SELECT USING (true);

CREATE POLICY "companies_insert_admin" ON public.companies 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "companies_update_admin" ON public.companies 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "companies_delete_admin" ON public.companies 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- RLS Policies for benefits (everyone can read active, only admin can modify)
CREATE POLICY "benefits_select_all" ON public.benefits 
  FOR SELECT USING (true);

CREATE POLICY "benefits_insert_admin" ON public.benefits 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "benefits_update_admin" ON public.benefits 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "benefits_delete_admin" ON public.benefits 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- RLS Policies for user_benefits
CREATE POLICY "user_benefits_select_own" ON public.user_benefits 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_benefits_select_admin" ON public.user_benefits 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "user_benefits_insert_admin" ON public.user_benefits 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "user_benefits_update_own" ON public.user_benefits 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_benefits_update_admin" ON public.user_benefits 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "user_benefits_delete_admin" ON public.user_benefits 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON public.profiles(activo);
CREATE INDEX IF NOT EXISTS idx_companies_categoria ON public.companies(categoria);
CREATE INDEX IF NOT EXISTS idx_companies_activo ON public.companies(activo);
CREATE INDEX IF NOT EXISTS idx_benefits_company ON public.benefits(company_id);
CREATE INDEX IF NOT EXISTS idx_benefits_tipo ON public.benefits(tipo);
CREATE INDEX IF NOT EXISTS idx_benefits_activo ON public.benefits(activo);
CREATE INDEX IF NOT EXISTS idx_user_benefits_user ON public.user_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_benefit ON public.user_benefits(benefit_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_estatus ON public.user_benefits(estatus);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_benefits_updated_at ON public.benefits;
CREATE TRIGGER update_benefits_updated_at
  BEFORE UPDATE ON public.benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_benefits_updated_at ON public.user_benefits;
CREATE TRIGGER update_user_benefits_updated_at
  BEFORE UPDATE ON public.user_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
