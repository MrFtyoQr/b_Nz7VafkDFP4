import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service_role key.
 * SOLO usar en código de servidor (API routes, Server Actions).
 * NUNCA importar en componentes 'use client'.
 * Bypasea RLS — úsalo con cuidado y solo para operaciones autorizadas.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return supabaseCreateClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
