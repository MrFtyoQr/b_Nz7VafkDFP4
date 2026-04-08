const { Router } = require('express')
const { z } = require('zod')
const { createAdminClient } = require('../lib/supabase')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = Router()

// GET /api/companies — Lista todas las empresas (autenticados)
router.get('/', requireAuth, async (req, res) => {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Error al obtener empresas' })
  }

  res.json(data)
})

// GET /api/companies/:id — Detalle de empresa
router.get('/:id', requireAuth, async (req, res) => {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*, benefits(*)')
    .eq('id', req.params.id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Empresa no encontrada' })
  }

  res.json(data)
})

const CompanySchema = z.object({
  nombre: z.string().min(1),
  logo_url: z.string().url().nullable().optional(),
  categoria: z.enum(['salud','entretenimiento','alimentacion','fitness','educacion','servicios','tecnologia','otros']),
  descripcion: z.string().nullable().optional(),
  fecha_inicio: z.string(),
  fecha_fin: z.string().nullable().optional(),
  activo: z.boolean().optional().default(true),
})

// POST /api/companies — Crear empresa (solo admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const parse = CompanySchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('companies')
    .insert(parse.data)
    .select()
    .single()

  if (error) {
    console.error('Error al crear empresa:', error)
    return res.status(500).json({ error: 'Error al crear la empresa' })
  }

  res.status(201).json(data)
})

// PATCH /api/companies/:id — Actualizar empresa (solo admin)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const parse = CompanySchema.partial().safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('companies')
    .update(parse.data)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: 'Error al actualizar la empresa' })
  }

  res.json(data)
})

// DELETE /api/companies/:id — Eliminar empresa (solo admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', req.params.id)

  if (error) {
    return res.status(500).json({ error: 'Error al eliminar la empresa' })
  }

  res.json({ success: true })
})

module.exports = router
