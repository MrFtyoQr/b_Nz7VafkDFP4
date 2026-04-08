import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden asignar beneficios' }, { status: 403 })
    }

    const { benefitId, addUserIds, removeUserIds } = await request.json()

    if (!benefitId) {
      return NextResponse.json({ error: 'benefitId es requerido' }, { status: 400 })
    }

    // Eliminar asignaciones removidas
    if (removeUserIds?.length > 0) {
      const { error } = await adminClient
        .from('user_benefits')
        .delete()
        .eq('benefit_id', benefitId)
        .in('user_id', removeUserIds)

      if (error) {
        console.error('Error al remover asignaciones:', error)
        return NextResponse.json({ error: 'Error al remover asignaciones' }, { status: 500 })
      }
    }

    // Agregar nuevas asignaciones
    if (addUserIds?.length > 0) {
      const newAssignments = addUserIds.map((userId: string) => ({
        user_id: userId,
        benefit_id: benefitId,
        estatus: 'activo',
      }))

      const { error } = await adminClient
        .from('user_benefits')
        .insert(newAssignments)

      if (error) {
        console.error('Error al agregar asignaciones:', error)
        return NextResponse.json({ error: 'Error al agregar asignaciones' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error en POST /api/benefits/assign:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
