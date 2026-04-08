import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Building2, Tag, MapPin, ExternalLink } from 'lucide-react'
import { CATEGORY_INFO } from '@/lib/types'

async function getDiscountCompanies(userId: string) {
  const supabase = await createClient()
  
  // Get unique companies that have active informational benefits for this user
  const { data: userBenefits } = await supabase
    .from('user_benefits')
    .select(`
      benefit:benefits!inner(
        tipo,
        company:companies(*)
      )
    `)
    .eq('user_id', userId)
    .eq('estatus', 'activo')

  // Also get all companies with active "informativo" type benefits assigned to "todos"
  const { data: allBenefits } = await supabase
    .from('benefits')
    .select(`
      tipo,
      company:companies(*)
    `)
    .eq('tipo', 'informativo')
    .eq('activo', true)
    .eq('asignado_a', 'todos')

  // Combine and deduplicate companies
  const companiesMap = new Map()
  
  userBenefits?.forEach((ub: any) => {
    if (ub.benefit?.tipo === 'informativo' && ub.benefit?.company) {
      companiesMap.set(ub.benefit.company.id, ub.benefit.company)
    }
  })
  
  allBenefits?.forEach((b: any) => {
    if (b.company) {
      companiesMap.set(b.company.id, b.company)
    }
  })

  return Array.from(companiesMap.values()).filter(c => c.activo)
}

export default async function DescuentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const companies = await getDiscountCompanies(user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Descuentos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Establecimientos con precios especiales para empleados CAMSA
        </p>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Empty
          icon={<Tag className="h-10 w-10" />}
          title="Sin descuentos disponibles"
          description="Actualmente no hay establecimientos con descuentos especiales. Mantente atento a nuevas promociones."
        />
      ) : (
        <div className="grid gap-4">
          {companies.map((company: any) => (
            <Card key={company.id} className="card-hover overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-4">
                  {/* Company Logo */}
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={company.nombre}
                        className="w-14 h-14 object-contain"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg">{company.nombre}</h3>
                      <Badge variant="outline" className="capitalize shrink-0">
                        {CATEGORY_INFO[company.categoria as keyof typeof CATEGORY_INFO]?.label || company.categoria}
                      </Badge>
                    </div>
                    
                    {company.descripcion && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {company.descripcion}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                      <Tag className="h-3 w-3" />
                      <span>Precio especial para empleados CAMSA</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Note */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Presenta tu credencial de empleado CAMSA para obtener los descuentos en los establecimientos participantes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
