import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { History, Building2, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { STATUS_INFO, BENEFIT_TYPE_INFO } from '@/lib/types'

async function getHistorialBenefits(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_benefits')
    .select(`
      *,
      benefit:benefits(*, company:companies(*))
    `)
    .eq('user_id', userId)
    .in('estatus', ['usado', 'vencido', 'desactivado'])
    .order('fecha_uso', { ascending: false, nullsFirst: false })

  return data || []
}

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const historial = await getHistorialBenefits(user.id)

  const getStatusIcon = (estatus: string) => {
    switch (estatus) {
      case 'usado':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'vencido':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'desactivado':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Historial</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cupones usados y beneficios anteriores
        </p>
      </div>

      {/* History List */}
      {historial.length === 0 ? (
        <Empty
          icon={<History className="h-10 w-10" />}
          title="Sin historial"
          description="Aquí aparecerán los cupones que hayas utilizado o que hayan vencido."
        />
      ) : (
        <div className="space-y-3">
          {historial.map((ub: any) => (
            <Card key={ub.id} className="opacity-80">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    ub.estatus === 'usado' 
                      ? 'bg-green-100' 
                      : ub.estatus === 'vencido'
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                  }`}>
                    {getStatusIcon(ub.estatus)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{ub.benefit?.titulo}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {ub.benefit?.company?.nombre}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={STATUS_INFO[ub.estatus as keyof typeof STATUS_INFO]?.color}
                      >
                        {STATUS_INFO[ub.estatus as keyof typeof STATUS_INFO]?.label}
                      </Badge>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {ub.benefit?.valor && (
                        <span className="font-medium text-foreground/70">
                          {ub.benefit.valor}
                        </span>
                      )}
                      <Badge variant="outline" className={`${BENEFIT_TYPE_INFO[ub.benefit?.tipo as keyof typeof BENEFIT_TYPE_INFO]?.color} text-xs`}>
                        {BENEFIT_TYPE_INFO[ub.benefit?.tipo as keyof typeof BENEFIT_TYPE_INFO]?.label}
                      </Badge>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {ub.estatus === 'usado' && ub.fecha_uso ? (
                        <span>
                          Usado el {new Date(ub.fecha_uso).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span>
                          Asignado el {new Date(ub.fecha_asignacion).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
