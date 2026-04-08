const { Router } = require('express')
const { z } = require('zod')
const { createAdminClient } = require('../lib/supabase')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = Router()

// GET /api/benefits — Lista beneficios
router.get('/', requireAuth, async (req, res) => {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('benefits')
    .select('*, company:companies(id, nombre, logo_url, categoria)')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Error al obtener beneficios' })
  }

  res.json(data)
})

// GET /api/benefits/:id — Detalle
router.get('/:id', requireAuth, async (req, res) => {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('benefits')
    .select('*, company:companies(*)')
    .eq('id', req.params.id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Beneficio no encontrado' })
  }

  res.json(data)
})

const BenefitSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().nullable().optional(),
  tipo: z.enum(['descuento', 'pago_cubierto', 'informativo']),
  valor: z.string().nullable().optional(),
  imagen_url: z.string().url().nullable().optional(),
  company_id: z.string().uuid(),
  fecha_vencimiento: z.string().nullable().optional(),
  activo: z.boolean().optional().default(true),
  asignado_a: z.enum(['individual', 'grupo', 'todos']).optional().default('individual'),
})

// POST /api/benefits — Crear beneficio (solo admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const parse = BenefitSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('benefits')
    .insert(parse.data)
    .select('*, company:companies(*)')
    .single()

  if (error) {
    console.error('Error al crear beneficio:', error)
    return res.status(500).json({ error: 'Error al crear el beneficio' })
  }

  res.status(201).json(data)
})

// PATCH /api/benefits/:id — Actualizar beneficio (solo admin)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const parse = BenefitSchema.partial().safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('benefits')
    .update(parse.data)
    .eq('id', req.params.id)
    .select('*, company:companies(*)')
    .single()

  if (error) {
    return res.status(500).json({ error: 'Error al actualizar el beneficio' })
  }

  res.json(data)
})

// DELETE /api/benefits/:id — Eliminar beneficio (solo admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('benefits')
    .delete()
    .eq('id', req.params.id)

  if (error) {
    return res.status(500).json({ error: 'Error al eliminar el beneficio' })
  }

  res.json({ success: true })
})

// POST /api/benefits/:id/assign — Asignar beneficio a empleados (solo admin)
const AssignSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'Debes seleccionar al menos un empleado'),
})

router.post('/:id/assign', requireAuth, requireAdmin, async (req, res) => {
  const parse = AssignSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }

  const supabase = createAdminClient()
  const benefitId = req.params.id

  // Verificar que el beneficio existe y está activo
  const { data: benefit, error: benefitError } = await supabase
    .from('benefits')
    .select('id, activo')
    .eq('id', benefitId)
    .single()

  if (benefitError || !benefit) {
    return res.status(404).json({ error: 'Beneficio no encontrado' })
  }

  if (!benefit.activo) {
    return res.status(409).json({ error: 'No se puede asignar un beneficio inactivo' })
  }

  // Crear asignaciones (upsert para evitar duplicados)
  const assignments = parse.data.userIds.map((userId) => ({
    user_id: userId,
    benefit_id: benefitId,
    estatus: 'activo',
  }))

  const { data, error } = await supabase
    .from('user_benefits')
    .upsert(assignments, { onConflict: 'user_id,benefit_id', ignoreDuplicates: true })
    .select()

  if (error) {
    console.error('Error al asignar beneficio:', error)
    return res.status(500).json({ error: 'Error al asignar el beneficio' })
  }

  res.status(201).json({ assigned: data?.length || 0 })
})

module.exports = router
