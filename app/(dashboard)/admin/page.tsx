import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Ticket, 
  Building2, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { BENEFIT_TYPE_INFO, STATUS_INFO } from '@/lib/types'

async function getDashboardStats() {
  const supabase = await createClient()
  
  // Get total employees
  const { count: totalEmpleados } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'empleado')
    .eq('activo', true)

  // Get active coupons
  const { count: cuponesActivos } = await supabase
    .from('user_benefits')
    .select('*', { count: 'exact', head: true })
    .eq('estatus', 'activo')

  // Get used coupons this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count: cuponesUsadosMes } = await supabase
    .from('user_benefits')
    .select('*', { count: 'exact', head: true })
    .eq('estatus', 'usado')
    .gte('fecha_uso', startOfMonth.toISOString())

  // Get active companies
  const { count: empresasActivas } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  return {
    totalEmpleados: totalEmpleados || 0,
    cuponesActivos: cuponesActivos || 0,
    cuponesUsadosMes: cuponesUsadosMes || 0,
    empresasActivas: empresasActivas || 0,
  }
}

async function getRecentCoupons() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_benefits')
    .select(`
      *,
      benefit:benefits(*, company:companies(*)),
      profile:profiles(nombre, apellido, email)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return data || []
}

async function getRecentCompanies() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: false })
    .limit(4)

  return data || []
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()
  const recentCoupons = await getRecentCoupons()
  const recentCompanies = await getRecentCompanies()

  const statCards = [
    {
      title: 'Empleados',
      value: stats.totalEmpleados,
      icon: Users,
      description: 'Usuarios activos',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Cupones Activos',
      value: stats.cuponesActivos,
      icon: Ticket,
      description: 'En circulación',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Usados este mes',
      value: stats.cuponesUsadosMes,
      icon: TrendingUp,
      description: 'Beneficios canjeados',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Empresas',
      value: stats.empresasActivas,
      icon: Building2,
      description: 'Convenios activos',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ]

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido al panel de administración
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/empresas/nueva">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Empresa
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-accent">
            <Link href="/admin/cupones/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cupón
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Coupons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif">Cupones Recientes</CardTitle>
              <CardDescription>Últimas asignaciones de beneficios</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/cupones">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay cupones asignados aún
              </p>
            ) : (
              <div className="space-y-4">
                {recentCoupons.map((ub: any) => (
                  <div key={ub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Ticket className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ub.benefit?.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {ub.profile?.nombre} {ub.profile?.apellido}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={STATUS_INFO[ub.estatus as keyof typeof STATUS_INFO]?.color}
                    >
                      {STATUS_INFO[ub.estatus as keyof typeof STATUS_INFO]?.label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif">Empresas con Convenio</CardTitle>
              <CardDescription>Empresas activas en la plataforma</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/empresas">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCompanies.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay empresas registradas aún
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentCompanies.map((company: any) => (
                  <div 
                    key={company.id} 
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url} 
                          alt={company.nombre}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{company.nombre}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {company.categoria}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
