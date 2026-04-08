import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { STATUS_INFO, BENEFIT_TYPE_INFO } from '@/lib/types'
import { ReportFilters } from '@/components/report-filters'
import { Ticket, TrendingUp, Users, Building2 } from 'lucide-react'

interface Props {
  searchParams: Promise<{
    estatus?: string
    empresa?: string
    mes?: string
  }>
}

async function getReportData(filters: { estatus?: string; empresa?: string; mes?: string }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('user_benefits')
    .select(`
      *,
      benefit:benefits(*, company:companies(*)),
      profile:profiles(nombre, apellido, email)
    `)
    .order('updated_at', { ascending: false })

  // Apply filters
  if (filters.estatus && filters.estatus !== 'todos') {
    query = query.eq('estatus', filters.estatus)
  }

  if (filters.mes) {
    const [year, month] = filters.mes.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0)
    query = query
      .gte('fecha_uso', startDate.toISOString())
      .lte('fecha_uso', endDate.toISOString())
  }

  const { data } = await query

  // Filter by company if needed (post-query since it's in a nested object)
  let filteredData = data || []
  if (filters.empresa && filters.empresa !== 'todas') {
    filteredData = filteredData.filter((item: any) => item.benefit?.company_id === filters.empresa)
  }

  return filteredData
}

async function getCompanies() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('companies')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')
  
  return data || []
}

async function getStats() {
  const supabase = await createClient()
  
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: usadosEsteMes } = await supabase
    .from('user_benefits')
    .select('*', { count: 'exact', head: true })
    .eq('estatus', 'usado')
    .gte('fecha_uso', startOfMonth.toISOString())

  const { count: totalActivos } = await supabase
    .from('user_benefits')
    .select('*', { count: 'exact', head: true })
    .eq('estatus', 'activo')

  const { count: totalUsados } = await supabase
    .from('user_benefits')
    .select('*', { count: 'exact', head: true })
    .eq('estatus', 'usado')

  return {
    usadosEsteMes: usadosEsteMes || 0,
    totalActivos: totalActivos || 0,
    totalUsados: totalUsados || 0,
  }
}

export default async function ReportesPage({ searchParams }: Props) {
  const filters = await searchParams
  const [reportData, companies, stats] = await Promise.all([
    getReportData(filters),
    getCompanies(),
    getStats(),
  ])

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground mt-1">
          Historial de uso de beneficios y estadísticas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.usadosEsteMes}</p>
                <p className="text-xs text-muted-foreground">Usados este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Ticket className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalActivos}</p>
                <p className="text-xs text-muted-foreground">Cupones activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsados}</p>
                <p className="text-xs text-muted-foreground">Total canjeados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ReportFilters companies={companies} />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Beneficios</CardTitle>
          <CardDescription>
            {reportData.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay registros que coincidan con los filtros seleccionados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Beneficio</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Fecha Uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.profile?.nombre} {item.profile?.apellido}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.profile?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.benefit?.titulo}</p>
                        {item.benefit?.valor && (
                          <p className="text-xs text-primary">{item.benefit?.valor}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {item.benefit?.company?.nombre}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={BENEFIT_TYPE_INFO[item.benefit?.tipo as keyof typeof BENEFIT_TYPE_INFO]?.color}>
                          {BENEFIT_TYPE_INFO[item.benefit?.tipo as keyof typeof BENEFIT_TYPE_INFO]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_INFO[item.estatus as keyof typeof STATUS_INFO]?.color}>
                          {STATUS_INFO[item.estatus as keyof typeof STATUS_INFO]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.fecha_uso 
                          ? new Date(item.fecha_uso).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
