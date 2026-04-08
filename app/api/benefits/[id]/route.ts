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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const allowed = ['titulo','descripcion','tipo','valor','imagen_url','company_id','fecha_vencimiento','asignado_a','activo','requiere_comprobante','porcentaje_reembolso']
  const payload: Record<string, any> = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (payload.requiere_comprobante === false) payload.porcentaje_reembolso = null

  const { data, error } = await admin.from('benefits').update(payload).eq('id', id).select('*, company:companies(*)').single()
  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const { error } = await admin.from('benefits').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  return NextResponse.json({ success: true })
}
