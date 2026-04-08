import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'admin') return null
  return admin
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { nombre, logo_url, categoria, descripcion, direccion, fecha_inicio, fecha_fin, activo } = body

  if (!nombre || !categoria || !fecha_inicio) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('companies')
    .insert({ nombre, logo_url: logo_url || null, categoria, descripcion: descripcion || null, direccion: direccion || null, fecha_inicio, fecha_fin: fecha_fin || null, activo: activo ?? true })
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
