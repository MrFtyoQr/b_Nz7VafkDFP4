import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

// POST — admin aprueba o rechaza un comprobante
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'admin') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const { userBenefitId, accion, notasAdmin } = await request.json()
  if (!userBenefitId || !accion || !['aprobado', 'rechazado'].includes(accion)) {
    return NextResponse.json({ error: 'Parámetros inválidos. accion debe ser "aprobado" o "rechazado"' }, { status: 400 })
  }

  const updates: Record<string, any> = {
    comprobante_estado: accion,
    notas_admin: notasAdmin || null,
  }

  // Si se aprueba, marcar el cupón como usado
  if (accion === 'aprobado') {
    updates.estatus = 'usado'
    updates.fecha_uso = new Date().toISOString()
  }

  const { error } = await admin.from('user_benefits').update(updates).eq('id', userBenefitId)
  if (error) return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })

  return NextResponse.json({ success: true })
}
