'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Benefit, Profile, BENEFIT_TYPE_INFO } from '@/lib/types'

interface AssignBenefitFormProps {
  benefit: Benefit & { company: { nombre: string } }
  employees: Profile[]
  assignedUserIds: string[]
}

export function AssignBenefitForm({ benefit, employees, assignedUserIds }: AssignBenefitFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(assignedUserIds)

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const selectAll = () => setSelectedEmployees(employees.map(e => e.id))
  const deselectAll = () => setSelectedEmployees([])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const addUserIds = selectedEmployees.filter(id => !assignedUserIds.includes(id))
      const removeUserIds = assignedUserIds.filter(id => !selectedEmployees.includes(id))

      const res = await fetch('/api/benefits/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefitId: benefit.id, addUserIds, removeUserIds }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar asignaciones')
      }

      toast.success('Asignaciones actualizadas correctamente')
      router.push('/admin/cupones')
      router.refresh()
    } catch (error: any) {
      toast.error('Error al actualizar las asignaciones')
    } finally {
      setLoading(false)
    }
  }

  const newAssignments = selectedEmployees.filter(id => !assignedUserIds.includes(id)).length
  const removedAssignments = assignedUserIds.filter(id => !selectedEmployees.includes(id)).length

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/cupones">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold">Asignar Beneficio</h1>
          <p className="text-muted-foreground">
            Selecciona los empleados que recibirán este beneficio
          </p>
        </div>
      </div>

      {/* Benefit Info Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{benefit.titulo}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{benefit.company.nombre}</span>
                <Badge variant="outline" className={BENEFIT_TYPE_INFO[benefit.tipo as keyof typeof BENEFIT_TYPE_INFO]?.color}>
                  {BENEFIT_TYPE_INFO[benefit.tipo as keyof typeof BENEFIT_TYPE_INFO]?.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Empleados</CardTitle>
              <CardDescription>
                {selectedEmployees.length} de {employees.length} seleccionados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Seleccionar todos
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deseleccionar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay empleados registrados
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {employees.map((employee) => {
                const isSelected = selectedEmployees.includes(employee.id)
                const wasAssigned = assignedUserIds.includes(employee.id)
                
                return (
                  <div
                    key={employee.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => toggleEmployee(employee.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {employee.nombre[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {employee.nombre} {employee.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">{employee.email}</p>
                    </div>
                    {wasAssigned && isSelected && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              {newAssignments > 0 && (
                <span className="text-green-600">+{newAssignments} nuevas asignaciones</span>
              )}
              {newAssignments > 0 && removedAssignments > 0 && <span className="mx-2">|</span>}
              {removedAssignments > 0 && (
                <span className="text-red-600">-{removedAssignments} a remover</span>
              )}
              {newAssignments === 0 && removedAssignments === 0 && (
                <span className="text-muted-foreground">Sin cambios</span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-accent"
              onClick={handleSubmit}
              disabled={loading || (newAssignments === 0 && removedAssignments === 0)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar asignaciones'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
