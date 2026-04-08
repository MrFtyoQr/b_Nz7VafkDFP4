'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Receipt } from 'lucide-react'
import Link from 'next/link'
import { Benefit, BenefitType, AssignmentType, Company, BENEFIT_TYPE_INFO } from '@/lib/types'

interface BenefitFormProps {
  benefit?: Benefit
}

const benefitTypes: BenefitType[] = ['descuento', 'pago_cubierto', 'informativo']
const assignmentTypes: AssignmentType[] = ['todos', 'grupo', 'individual']

export function BenefitForm({ benefit }: BenefitFormProps) {
  const router = useRouter()
  const isEditing = !!benefit
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    titulo:               benefit?.titulo               || '',
    descripcion:          benefit?.descripcion          || '',
    tipo:                 benefit?.tipo                 || 'descuento' as BenefitType,
    valor:                benefit?.valor                || '',
    imagen_url:           benefit?.imagen_url           || '',
    company_id:           benefit?.company_id           || '',
    fecha_vencimiento:    benefit?.fecha_vencimiento    || '',
    asignado_a:           benefit?.asignado_a           || 'todos' as AssignmentType,
    activo:               benefit?.activo               ?? true,
    requiere_comprobante: benefit?.requiere_comprobante ?? false,
    porcentaje_reembolso: benefit?.porcentaje_reembolso?.toString() || '50',
  })

  const set = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }))

  useEffect(() => {
    supabase.from('companies').select('*').eq('activo', true).order('nombre')
      .then(({ data }) => setCompanies(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        fecha_vencimiento:    formData.fecha_vencimiento    || null,
        imagen_url:           formData.imagen_url           || null,
        porcentaje_reembolso: formData.requiere_comprobante
          ? parseInt(formData.porcentaje_reembolso) || null
          : null,
      }

      const url    = isEditing ? `/api/benefits/${benefit.id}` : '/api/benefits'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al guardar'); return }

      toast.success(isEditing ? 'Beneficio actualizado' : 'Beneficio creado')
      router.push('/admin/cupones')
      router.refresh()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/cupones"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold">{isEditing ? 'Editar Beneficio' : 'Nuevo Beneficio'}</h1>
          <p className="text-muted-foreground">{isEditing ? 'Modifica los datos del cupón' : 'Crea un nuevo cupón o beneficio'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Información del Beneficio</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" value={formData.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: Hamburguesa gratis al mes" required disabled={loading} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_id">Empresa *</Label>
                <Select value={formData.company_id} onValueChange={v => set('company_id', v)} required>
                  <SelectTrigger><SelectValue placeholder="Selecciona empresa" /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de beneficio *</Label>
                <Select value={formData.tipo} onValueChange={v => set('tipo', v as BenefitType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {benefitTypes.map(t => (
                      <SelectItem key={t} value={t}>{BENEFIT_TYPE_INFO[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor / Descripción corta</Label>
                <Input id="valor" value={formData.valor} onChange={e => set('valor', e.target.value)} placeholder="Ej: 1 hamburguesa, 50%, $500 MXN" disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asignado_a">Asignar a</Label>
                <Select value={formData.asignado_a} onValueChange={v => set('asignado_a', v as AssignmentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los empleados</SelectItem>
                    <SelectItem value="grupo">Grupo específico</SelectItem>
                    <SelectItem value="individual">Asignación individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción / Condiciones</Label>
              <Textarea id="descripcion" value={formData.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Describe el beneficio, cómo canjearlo y sus condiciones..." rows={3} disabled={loading} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_vencimiento">Vence el</Label>
                <Input id="fecha_vencimiento" type="date" value={formData.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagen_url">URL imagen (opcional)</Label>
                <Input id="imagen_url" type="url" value={formData.imagen_url} onChange={e => set('imagen_url', e.target.value)} placeholder="https://..." disabled={loading} />
              </div>
            </div>

            {/* Reembolso / Comprobante */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Receipt className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <Label htmlFor="requiere_comprobante" className="text-base cursor-pointer">
                      Requiere comprobante de pago
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      El empleado sube su ticket/factura y tú cubres parte o todo el costo
                    </p>
                  </div>
                </div>
                <Switch
                  id="requiere_comprobante"
                  checked={formData.requiere_comprobante}
                  onCheckedChange={v => set('requiere_comprobante', v)}
                />
              </div>

              {formData.requiere_comprobante && (
                <div className="space-y-2 pl-8">
                  <Label htmlFor="porcentaje_reembolso">¿Qué porcentaje cubre la empresa? (%)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="porcentaje_reembolso"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.porcentaje_reembolso}
                      onChange={e => set('porcentaje_reembolso', e.target.value)}
                      className="w-28"
                      disabled={loading}
                    />
                    <span className="text-muted-foreground text-sm">% del costo total</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ej: 50 = la empresa cubre la mitad · 100 = la empresa cubre todo
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div>
                <Label htmlFor="activo" className="text-base">Beneficio activo</Label>
                <p className="text-sm text-muted-foreground">Los beneficios inactivos no se muestran a empleados</p>
              </div>
              <Switch id="activo" checked={formData.activo} onCheckedChange={v => set('activo', v)} />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={loading}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-accent" disabled={loading || !formData.company_id}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : isEditing ? 'Guardar cambios' : 'Crear beneficio'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
