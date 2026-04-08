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
  const { titulo, descripcion, tipo, valor, imagen_url, company_id, fecha_vencimiento, asignado_a, activo, requiere_comprobante, porcentaje_reembolso } = body

  if (!titulo || !tipo || !company_id) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('benefits')
    .insert({
      titulo,
      descripcion: descripcion || null,
      tipo,
      valor: valor || null,
      imagen_url: imagen_url || null,
      company_id,
      fecha_vencimiento: fecha_vencimiento || null,
      asignado_a: asignado_a || 'individual',
      activo: activo ?? true,
      requiere_comprobante: requiere_comprobante ?? false,
      porcentaje_reembolso: requiere_comprobante ? (porcentaje_reembolso ?? null) : null,
    })
    .select('*, company:companies(*)')
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear el beneficio' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
