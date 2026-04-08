import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Calendar, Ticket } from 'lucide-react'
import Link from 'next/link'
import { STATUS_INFO, BENEFIT_TYPE_INFO } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmpleadoDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: employee } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!employee) {
    notFound()
  }

  const { data: benefits } = await supabase
    .from('user_benefits')
    .select(`
      *,
      benefit:benefits(*, company:companies(nombre))
    `)
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/empleados">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold">
            {employee.nombre} {employee.apellido}
          </h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {employee.email}
          </p>
        </div>
      </div>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={employee.activo ? 'default' : 'secondary'} className={employee.activo ? 'bg-green-100 text-green-800' : ''}>
                {employee.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rol</p>
              <p className="font-medium capitalize">{employee.rol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de registro</p>
              <p className="font-medium">
                {new Date(employee.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Beneficios Asignados</CardTitle>
          <CardDescription>
            {benefits?.length || 0} beneficios en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!benefits || benefits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Este empleado no tiene beneficios asignados
            </p>
          ) : (
            <div className="space-y-3">
              {benefits.map((ub: any) => (
                <div 
                  key={ub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{ub.benefit?.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {ub.benefit?.company?.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={BENEFIT_TYPE_INFO[ub.benefit?.tipo as keyof typeof BENEFIT_TYPE_INFO]?.color}>
                      {BENEFIT_TYPE_INFO[ub.benefit?.tipo as keyof typeof BENEFIT_TYPE_INFO]?.label}
                    </Badge>
                    <Badge variant="outline" className={STATUS_INFO[ub.estatus as keyof typeof STATUS_INFO]?.color}>
                      {STATUS_INFO[ub.estatus as keyof typeof STATUS_INFO]?.label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
