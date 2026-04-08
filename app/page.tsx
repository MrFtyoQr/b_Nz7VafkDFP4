import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Ticket, Building2, Users, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // If logged in, redirect to appropriate dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol === 'admin') {
      redirect('/admin')
    } else {
      redirect('/mi-cuponera')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <header className="relative container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Logo size="md" />
            <Button asChild className="bg-primary hover:bg-accent text-primary-foreground">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </nav>
        </header>

        <main className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              Tus beneficios corporativos,{' '}
              <span className="text-gold-gradient">en un solo lugar</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto text-balance">
              Cuponera CAMSA te permite acceder a descuentos exclusivos, 
              membresías y beneficios especiales negociados para ti.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-accent text-primary-foreground px-8">
                <Link href="/login">
                  Acceder a mis beneficios
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-center mb-12">
            Todo lo que necesitas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Ticket,
                title: 'Cupones Exclusivos',
                description: 'Accede a descuentos especiales en restaurantes, entretenimiento y más.',
              },
              {
                icon: Building2,
                title: 'Empresas Aliadas',
                description: 'Convenios con las mejores empresas de la región para tu bienestar.',
              },
              {
                icon: Users,
                title: 'Beneficios para Ti',
                description: 'Membresías de gimnasio, seguros y servicios con precios preferenciales.',
              },
              {
                icon: Shield,
                title: 'Fácil y Seguro',
                description: 'Reporta el uso de tus cupones de forma sencilla desde tu celular.',
              },
            ].map((feature) => (
              <div 
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl lg:text-3xl font-bold mb-4">
              ¿Eres empleado de CAMSA?
            </h2>
            <p className="text-muted-foreground mb-8">
              Ingresa con tu correo corporativo para ver todos los beneficios disponibles para ti.
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-accent text-primary-foreground">
              <Link href="/login">
                Iniciar Sesión
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CAMSA. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
