const { verifySupabaseToken, createAdminClient } = require('../lib/supabase')

/**
 * Middleware: verifica el JWT de Supabase en el header Authorization.
 * Añade req.user (datos de auth) y req.profile (datos de perfil) al request.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' })
  }

  const token = authHeader.replace('Bearer ', '').trim()

  const user = await verifySupabaseToken(token)

  if (!user) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  // Cargar perfil del usuario para tener el rol
  const supabase = createAdminClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email, rol, activo')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return res.status(401).json({ error: 'Perfil de usuario no encontrado' })
  }

  if (!profile.activo) {
    return res.status(403).json({ error: 'Cuenta desactivada. Contacta al administrador.' })
  }

  req.user = user
  req.profile = profile

  // Log role-aware access
  const role = profile.rol === 'admin' ? '[ADMIN]' : '[EMPLEADO]'
  console.log(`${role} ${profile.email} → ${req.method} ${req.originalUrl}`)

  next()
}

/**
 * Middleware: requiere que el usuario tenga rol 'admin'.
 * Usar después de requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.profile || req.profile.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' })
  }
  next()
}

module.exports = { requireAuth, requireAdmin }
