'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'

interface ReportFiltersProps {
  companies: { id: string; nombre: string }[]
}

export function ReportFilters({ companies }: ReportFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentEstatus = searchParams.get('estatus') || 'todos'
  const currentEmpresa = searchParams.get('empresa') || 'todas'
  const currentMes = searchParams.get('mes') || ''

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'todos' && value !== 'todas') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/reportes?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/admin/reportes')
  }

  const hasFilters = currentEstatus !== 'todos' || currentEmpresa !== 'todas' || currentMes

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estatus:</span>
            <Select value={currentEstatus} onValueChange={(v) => updateFilter('estatus', v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="usado">Usado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="desactivado">Desactivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Empresa:</span>
            <Select value={currentEmpresa} onValueChange={(v) => updateFilter('empresa', v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mes:</span>
            <input
              type="month"
              value={currentMes}
              onChange={(e) => updateFilter('mes', e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
