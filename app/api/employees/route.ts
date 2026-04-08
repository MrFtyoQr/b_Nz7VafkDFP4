import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Verificar que quien llama es admin
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
      return NextResponse.json({ error: 'Solo administradores pueden crear empleados' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, apellido, email, password, cargo } = body

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Crear usuario con admin API — NO afecta la sesión del admin actual
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma el email automáticamente sin enviar correo
      user_metadata: { nombre, apellido, rol: 'empleado', cargo: cargo || null },
    })

    if (createError) {
      if (createError.message?.includes('already registered') || createError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 })
      }
      console.error('Error creando usuario:', createError)
      return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
    }

    // Actualizar cargo en el perfil (el trigger crea el perfil, nosotros actualizamos el cargo)
    if (cargo) {
      await adminClient
        .from('profiles')
        .update({ cargo })
        .eq('id', authData.user.id)
    }

    return NextResponse.json({ id: authData.user.id, email, nombre, apellido }, { status: 201 })
  } catch (err) {
    console.error('Error en POST /api/employees:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
