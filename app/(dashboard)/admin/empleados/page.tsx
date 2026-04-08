import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Mail, Ticket, Plus } from 'lucide-react'
import Link from 'next/link'

async function getEmployees() {
  const supabase = await createClient()
  
  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'empleado')
    .order('nombre')

  // Get benefit counts for each employee
  const employeesWithCounts = await Promise.all(
    (employees || []).map(async (employee) => {
      const { count } = await supabase
        .from('user_benefits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', employee.id)
        .eq('estatus', 'activo')

      return {
        ...employee,
        activeBenefits: count || 0,
      }
    })
  )

  return employeesWithCounts
}

export default async function EmpleadosPage() {
  const employees = await getEmployees()

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Empleados</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los usuarios de la plataforma
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-accent">
          <Link href="/admin/empleados/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </Link>
        </Button>
      </div>

      {/* Employees List */}
      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sin empleados registrados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando empleados a la plataforma
            </p>
            <Button asChild>
              <Link href="/admin/empleados/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Empleado
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {employees.map((employee) => (
            <Card key={employee.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                    {employee.nombre[0]?.toUpperCase()}{employee.apellido[0]?.toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {employee.nombre} {employee.apellido}
                      </h3>
                      <Badge variant={employee.activo ? 'default' : 'secondary'} className={employee.activo ? 'bg-green-100 text-green-800' : ''}>
                        {employee.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {employee.activeBenefits} beneficios activos
                      </span>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/empleados/${employee.id}`}>
                      Ver detalles
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
