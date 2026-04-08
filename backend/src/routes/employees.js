const { Router } = require('express')
const { z } = require('zod')
const { createAdminClient } = require('../lib/supabase')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = Router()

// Todos los endpoints de empleados requieren admin
router.use(requireAuth, requireAdmin)

// GET /api/employees — Lista todos los empleados
router.get('/', async (req, res) => {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'empleado')
    .order('apellido', { ascending: true })

  if (error) {
    console.error('Error al listar empleados:', error)
    return res.status(500).json({ error: 'Error al obtener empleados' })
  }

  res.json(data)
})

// GET /api/employees/:id — Detalle de un empleado con sus beneficios
router.get('/:id', async (req, res) => {
  const supabase = createAdminClient()
  const { id } = req.params

  const [profileResult, benefitsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('user_benefits')
      .select('*, benefit:benefits(*, company:companies(*))')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (profileResult.error || !profileResult.data) {
    return res.status(404).json({ error: 'Empleado no encontrado' })
  }

  res.json({
    profile: profileResult.data,
    benefits: benefitsResult.data || [],
  })
})

const CreateEmployeeSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

// POST /api/employees — Crear nuevo empleado
router.post('/', async (req, res) => {
  const parse = CreateEmployeeSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }

  const { nombre, apellido, email, password } = parse.data
  const supabase = createAdminClient()

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido, rol: 'empleado' },
  })

  if (authError) {
    console.error('Error al crear usuario auth:', authError)
    if (authError.message.includes('already registered')) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' })
    }
    return res.status(500).json({ error: 'Error al crear el usuario' })
  }

  // El trigger handle_new_user() crea el profile automáticamente
  res.status(201).json({ id: authData.user.id, email, nombre, apellido })
})

const UpdateEmployeeSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  activo: z.boolean().optional(),
})

// PATCH /api/employees/:id — Actualizar empleado
router.patch('/:id', async (req, res) => {
  const parse = UpdateEmployeeSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }

  const supabase = createAdminClient()
  const { id } = req.params

  const { error } = await supabase
    .from('profiles')
    .update(parse.data)
    .eq('id', id)
    .eq('rol', 'empleado')

  if (error) {
    console.error('Error al actualizar empleado:', error)
    return res.status(500).json({ error: 'Error al actualizar el empleado' })
  }

  res.json({ success: true })
})

// DELETE /api/employees/:id — Desactivar empleado (soft delete)
router.delete('/:id', async (req, res) => {
  const supabase = createAdminClient()
  const { id } = req.params

  const { error } = await supabase
    .from('profiles')
    .update({ activo: false })
    .eq('id', id)
    .eq('rol', 'empleado')

  if (error) {
    console.error('Error al desactivar empleado:', error)
    return res.status(500).json({ error: 'Error al desactivar el empleado' })
  }

  res.json({ success: true })
})

module.exports = router
