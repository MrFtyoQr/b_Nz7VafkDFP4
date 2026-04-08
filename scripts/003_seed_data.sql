-- Seed data for Cuponera CAMSA
-- Sample companies and benefits for demonstration

-- Insert sample companies
INSERT INTO public.companies (nombre, categoria, descripcion, fecha_inicio, fecha_fin, activo, logo_url) VALUES
  ('SportCity', 'fitness', 'Membresía de gimnasio con acceso a todas las sucursales y clases grupales incluidas.', '2024-01-01', '2025-12-31', true, NULL),
  ('Cinépolis', 'entretenimiento', 'Descuento en boletos de cine y combos de palomitas en cualquier sucursal.', '2024-01-01', '2025-06-30', true, NULL),
  ('Óptica Lux', 'salud', 'Precios preferenciales en lentes graduados, armazones y exámenes de la vista.', '2024-01-01', NULL, true, NULL),
  ('VIPS Restaurantes', 'alimentacion', 'Descuento en consumo de alimentos y bebidas en todos los restaurantes VIPS.', '2024-03-01', '2025-03-01', true, NULL),
  ('Coursera', 'educacion', 'Acceso gratuito a cursos de desarrollo profesional y certificaciones.', '2024-01-01', '2025-12-31', true, NULL),
  ('Uber Empresarial', 'servicios', 'Viajes corporativos con tarifa preferencial y facturación centralizada.', '2024-06-01', '2025-06-01', true, NULL)
ON CONFLICT DO NOTHING;

-- Insert sample benefits linked to companies
INSERT INTO public.benefits (titulo, descripcion, tipo, valor, company_id, fecha_vencimiento, activo, asignado_a)
SELECT 
  'Membresía Gym Premium',
  'Tu empresa cubre el costo mensual de tu membresía en SportCity. Incluye acceso a todas las sucursales.',
  'pago_cubierto',
  '$1,200 MXN/mes',
  c.id,
  '2025-12-31',
  true,
  'todos'
FROM public.companies c WHERE c.nombre = 'SportCity'
ON CONFLICT DO NOTHING;

INSERT INTO public.benefits (titulo, descripcion, tipo, valor, company_id, fecha_vencimiento, activo, asignado_a)
SELECT 
  '2x1 en Boletos de Cine',
  'Presenta tu credencial corporativa y obtén 2x1 en boletos de cine tradicional de lunes a jueves.',
  'descuento',
  '50%',
  c.id,
  '2025-06-30',
  true,
  'todos'
FROM public.companies c WHERE c.nombre = 'Cinépolis'
ON CONFLICT DO NOTHING;

INSERT INTO public.benefits (titulo, descripcion, tipo, valor, company_id, fecha_vencimiento, activo, asignado_a)
SELECT 
  '30% en Lentes Graduados',
  'Descuento especial en la compra de lentes graduados con cualquier armazón.',
  'descuento',
  '30%',
  c.id,
  NULL,
  true,
  'todos'
FROM public.companies c WHERE c.nombre = 'Óptica Lux'
ON CONFLICT DO NOTHING;

INSERT INTO public.benefits (titulo, descripcion, tipo, valor, company_id, fecha_vencimiento, activo, asignado_a)
SELECT 
  '15% en Restaurantes VIPS',
  'Descuento en tu consumo total de alimentos y bebidas presentando tu credencial.',
  'descuento',
  '15%',
  c.id,
  '2025-03-01',
  true,
  'todos'
FROM public.companies c WHERE c.nombre = 'VIPS Restaurantes'
ON CONFLICT DO NOTHING;

INSERT INTO public.benefits (titulo, descripcion, tipo, valor, company_id, fecha_vencimiento, activo, asignado_a)
SELECT 
  'Coursera Plus Gratuito',
  'Acceso ilimitado a más de 7,000 cursos y certificaciones profesionales.',
  'pago_cubierto',
  'Acceso completo',
  c.id,
  '2025-12-31',
  true,
  'todos'
FROM public.companies c WHERE c.nombre = 'Coursera'
ON CONFLICT DO NOTHING;

INSERT INTO public.benefits (titulo, descripcion, tipo, valor, company_id, fecha_vencimiento, activo, asignado_a)
SELECT 
  'Viajes Uber Corporativos',
  'Tarifa preferencial para traslados de trabajo con facturación automática.',
  'informativo',
  'Hasta $500 MXN/mes',
  c.id,
  '2025-06-01',
  true,
  'todos'
FROM public.companies c WHERE c.nombre = 'Uber Empresarial'
ON CONFLICT DO NOTHING;
