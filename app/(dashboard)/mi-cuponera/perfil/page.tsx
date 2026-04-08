import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Completa tus datos — aparecerán en tu credencial digital
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
