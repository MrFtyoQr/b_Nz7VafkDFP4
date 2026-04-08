import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Ticket, Pencil, Building2, Users } from 'lucide-react'
import Link from 'next/link'
import { BENEFIT_TYPE_INFO } from '@/lib/types'
import { DeleteBenefitButton } from '@/components/delete-benefit-button'

async function getBenefits() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('benefits')
    .select(`
      *,
      company:companies(nombre, logo_url)
    `)
    .order('created_at', { ascending: false })

  return data || []
}

export default async function CuponesPage() {
  const benefits = await getBenefits()

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Cupones / Beneficios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los beneficios disponibles para empleados
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-accent">
          <Link href="/admin/cupones/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cupón
          </Link>
        </Button>
      </div>

      {/* Benefits List */}
      {benefits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sin cupones registrados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea tu primer beneficio para empleados
            </p>
            <Button asChild>
              <Link href="/admin/cupones/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Crear Cupón
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {benefits.map((benefit) => (
            <Card key={benefit.id} className="card-hover">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                  {/* Company Logo */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {benefit.company?.logo_url ? (
                        <img 
                          src={benefit.company.logo_url} 
                          alt={benefit.company.nombre}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <Ticket className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{benefit.titulo}</h3>
                        <Badge 
                          variant="outline" 
                          className={BENEFIT_TYPE_INFO[benefit.tipo as keyof typeof BENEFIT_TYPE_INFO]?.color}
                        >
                          {BENEFIT_TYPE_INFO[benefit.tipo as keyof typeof BENEFIT_TYPE_INFO]?.label}
                        </Badge>
                        {!benefit.activo && (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {benefit.company?.nombre}
                        </span>
                        {benefit.valor && (
                          <span className="font-medium text-primary">{benefit.valor}</span>
                        )}
                        {benefit.fecha_vencimiento && (
                          <span>Vence: {new Date(benefit.fecha_vencimiento).toLocaleDateString('es-MX')}</span>
                        )}
                      </div>
                      {benefit.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {benefit.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:flex-col lg:flex-row">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/cupones/${benefit.id}/asignar`}>
                        <Users className="h-4 w-4 mr-1" />
                        Asignar
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/cupones/${benefit.id}`}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <DeleteBenefitButton benefitId={benefit.id} benefitTitle={benefit.titulo} />
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
