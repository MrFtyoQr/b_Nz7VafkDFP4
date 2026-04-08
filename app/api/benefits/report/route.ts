import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar sesión del usuario con el cliente de cookies (anon key)
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 2. Obtener el ID del user_benefit del body
    const body = await request.json()
    const { userBenefitId } = body

    if (!userBenefitId || typeof userBenefitId !== 'string') {
      return NextResponse.json(
        { error: 'userBenefitId es requerido' },
        { status: 400 }
      )
    }

    // 3. Verificar con cliente admin (service_role) que este cupón pertenece al usuario
    const adminSupabase = createAdminClient()

    const { data: userBenefit, error: fetchError } = await adminSupabase
      .from('user_benefits')
      .select('id, user_id, estatus')
      .eq('id', userBenefitId)
      .single()

    if (fetchError || !userBenefit) {
      return NextResponse.json(
        { error: 'Cupón no encontrado' },
        { status: 404 }
      )
    }

    // 4. Asegurar que el cupón pertenece al usuario autenticado
    if (userBenefit.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este cupón' },
        { status: 403 }
      )
    }

    // 5. Solo se puede reportar un cupón activo
    if (userBenefit.estatus !== 'activo') {
      return NextResponse.json(
        { error: 'Este cupón no está activo y no puede ser reportado' },
        { status: 409 }
      )
    }

    // 6. Marcar como usado usando el cliente admin (service_role)
    const { error: updateError } = await adminSupabase
      .from('user_benefits')
      .update({
        estatus: 'usado',
        fecha_uso: new Date().toISOString(),
        reportado_por_usuario: true,
      })
      .eq('id', userBenefitId)

    if (updateError) {
      console.error('Error al actualizar user_benefit:', updateError)
      return NextResponse.json(
        { error: 'Error al registrar el uso' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error en /api/benefits/report:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
