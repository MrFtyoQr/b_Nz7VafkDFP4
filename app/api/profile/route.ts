import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  // Solo se permiten actualizar estos campos desde el propio usuario
  const allowed = ['nombre', 'apellido', 'cargo', 'foto_url']
  const payload = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Sin campos válidos para actualizar' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  return NextResponse.json(data)
}
