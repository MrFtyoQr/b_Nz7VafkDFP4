import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CredencialCard } from '@/components/credencial-card'

export default async function CredencialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Mi Credencial</h1>
        <p className="text-muted-foreground text-sm mt-1">Tu identificación digital CAMSA</p>
      </div>

      <CredencialCard profile={profile} />
    </div>
  )
}
