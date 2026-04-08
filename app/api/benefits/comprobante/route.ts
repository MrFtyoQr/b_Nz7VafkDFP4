import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

// POST — empleado sube URL del comprobante ya almacenado en Supabase Storage
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { userBenefitId, comprobanteUrl } = await request.json()
  if (!userBenefitId || !comprobanteUrl) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verificar que el user_benefit pertenece al usuario y el beneficio requiere comprobante
  const { data: ub, error: fetchError } = await admin
    .from('user_benefits')
    .select('id, user_id, estatus, benefit:benefits(requiere_comprobante)')
    .eq('id', userBenefitId)
    .single()

  if (fetchError || !ub) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (ub.user_id !== user.id) return NextResponse.json({ error: 'Prohibido' }, { status: 403 })
  if (ub.estatus !== 'activo') return NextResponse.json({ error: 'Cupón no activo' }, { status: 409 })
  if (!(ub.benefit as any)?.requiere_comprobante) {
    return NextResponse.json({ error: 'Este beneficio no requiere comprobante' }, { status: 409 })
  }

  const { error } = await admin
    .from('user_benefits')
    .update({ comprobante_url: comprobanteUrl, comprobante_estado: 'pendiente' })
    .eq('id', userBenefitId)

  if (error) return NextResponse.json({ error: 'Error al guardar comprobante' }, { status: 500 })
  return NextResponse.json({ success: true })
}
