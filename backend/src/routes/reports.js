const { Router } = require('express')
const { createAdminClient } = require('../lib/supabase')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = Router()

router.use(requireAuth, requireAdmin)

// GET /api/reports — Reporte de beneficios usados con filtros
// Query params: empleadoId, empresaId, tipo, mes (YYYY-MM), estatus
router.get('/', async (req, res) => {
  const supabase = createAdminClient()
  const { empleadoId, empresaId, tipo, mes, estatus } = req.query

  let query = supabase
    .from('user_benefits')
    .select(`
      id,
      estatus,
      fecha_asignacion,
      fecha_uso,
      reportado_por_usuario,
      notas,
      profile:profiles(id, nombre, apellido, email),
      benefit:benefits(id, titulo, tipo, valor, company:companies(id, nombre, categoria))
    `)
    .order('fecha_uso', { ascending: false, nullsFirst: false })
    .order('fecha_asignacion', { ascending: false })

  if (empleadoId) query = query.eq('user_id', empleadoId)
  if (estatus) query = query.eq('estatus', estatus)

  if (empresaId) {
    // Filtrar por empresa a través del beneficio
    const { data: benefitIds } = await supabase
      .from('benefits')
      .select('id')
      .eq('company_id', empresaId)

    if (benefitIds && benefitIds.length > 0) {
      query = query.in('benefit_id', benefitIds.map((b) => b.id))
    } else {
      return res.json([])
    }
  }

  if (tipo) {
    const { data: benefitIds } = await supabase
      .from('benefits')
      .select('id')
      .eq('tipo', tipo)

    if (benefitIds && benefitIds.length > 0) {
      query = query.in('benefit_id', benefitIds.map((b) => b.id))
    } else {
      return res.json([])
    }
  }

  if (mes) {
    // mes = "YYYY-MM"
    const [year, month] = mes.split('-')
    const start = new Date(Number(year), Number(month) - 1, 1)
    const end = new Date(Number(year), Number(month), 1)
    query = query.gte('fecha_uso', start.toISOString()).lt('fecha_uso', end.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener reportes:', error)
    return res.status(500).json({ error: 'Error al obtener reportes' })
  }

  res.json(data)
})

// GET /api/reports/summary — Resumen estadístico
router.get('/summary', async (req, res) => {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalEmpleados, cuponesActivos, cuponesUsadosMes, empresasActivas] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'empleado')
      .eq('activo', true),
    supabase
      .from('user_benefits')
      .select('*', { count: 'exact', head: true })
      .eq('estatus', 'activo'),
    supabase
      .from('user_benefits')
      .select('*', { count: 'exact', head: true })
      .eq('estatus', 'usado')
      .gte('fecha_uso', startOfMonth.toISOString()),
    supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true),
  ])

  res.json({
    totalEmpleados: totalEmpleados.count || 0,
    cuponesActivos: cuponesActivos.count || 0,
    cuponesUsadosMes: cuponesUsadosMes.count || 0,
    empresasActivas: empresasActivas.count || 0,
  })
})

// POST /api/reports/expire — Forzar vencimiento de cupones expirados
router.post('/expire', async (req, res) => {
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('expire_overdue_benefits')

  if (error) {
    console.error('Error al vencer cupones:', error)
    return res.status(500).json({ error: 'Error al procesar vencimientos' })
  }

  res.json({ success: true })
})

module.exports = router
