import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Pencil, Calendar } from 'lucide-react'
import Link from 'next/link'
import { CATEGORY_INFO } from '@/lib/types'
import { DeleteCompanyButton } from '@/components/delete-company-button'

async function getCompanies() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}

export default async function EmpresasPage() {
  const companies = await getCompanies()

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los convenios con empresas externas
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-accent">
          <Link href="/admin/empresas/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Empresa
          </Link>
        </Button>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Sin empresas registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primera empresa con convenio
            </p>
            <Button asChild>
              <Link href="/admin/empresas/nueva">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Empresa
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="card-hover overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url} 
                          alt={company.nombre}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <Building2 className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <Badge 
                      variant={company.activo ? 'default' : 'secondary'}
                      className={company.activo ? 'bg-green-100 text-green-800' : ''}
                    >
                      {company.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">{company.nombre}</h3>
                  <Badge variant="outline" className="mb-3 capitalize">
                    {CATEGORY_INFO[company.categoria as keyof typeof CATEGORY_INFO]?.label || company.categoria}
                  </Badge>
                  
                  {company.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {company.descripcion}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(company.fecha_inicio).toLocaleDateString('es-MX')}
                      {company.fecha_fin && ` - ${new Date(company.fecha_fin).toLocaleDateString('es-MX')}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex border-t border-border">
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="flex-1 rounded-none h-12"
                  >
                    <Link href={`/admin/empresas/${company.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Link>
                  </Button>
                  <div className="w-px bg-border" />
                  <DeleteCompanyButton companyId={company.id} companyName={company.nombre} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
