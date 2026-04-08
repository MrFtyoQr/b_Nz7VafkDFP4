const { createClient } = require('@supabase/supabase-js')

/**
 * Cliente admin con service_role key — bypasea RLS.
 * Solo para operaciones autorizadas del backend.
 */
function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Verifica un JWT de Supabase y retorna el usuario si es válido.
 * Usa el cliente anon para validar la sesión con la API de Supabase Auth.
 */
async function verifySupabaseToken(token) {
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: { user }, error } = await client.auth.getUser()

  if (error || !user) return null
  return user
}

module.exports = { createAdminClient, verifySupabaseToken }
