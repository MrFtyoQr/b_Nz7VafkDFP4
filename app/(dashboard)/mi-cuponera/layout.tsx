import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmployeeNavbar } from '@/components/employee-navbar'
import { EmployeeBottomNav } from '@/components/employee-bottom-nav'
import { AuthProvider } from '@/lib/auth-context'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is employee (redirect admin to admin panel)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.rol === 'admin') {
    redirect('/admin')
  }

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <EmployeeNavbar profile={profile} />
        <main className="flex-1 pb-20 lg:pb-0">
          <div className="container mx-auto px-4 py-6 max-w-2xl">
            {children}
          </div>
        </main>
        <EmployeeBottomNav />
      </div>
    </AuthProvider>
  )
}
