'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, Eye, Receipt, Users } from 'lucide-react'

interface ReembolsoItem {
  id: string
  comprobante_url: string
  comprobante_estado: string | null
  notas_admin: string | null
  created_at: string
  profile: { nombre: string; apellido: string; email: string } | null
  benefit: {
    titulo: string
    porcentaje_reembolso: number | null
    company: { nombre: string } | null
  } | null
}

export default function ReembolsosPage() {
  const [items, setItems]         = useState<ReembolsoItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<ReembolsoItem | null>(null)
  const [notas, setNotas]         = useState('')
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()

  const fetchPendientes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_benefits')
      .select(`
        id, comprobante_url, comprobante_estado, notas_admin, created_at,
        profile:profiles(nombre, apellido, email),
        benefit:benefits(titulo, porcentaje_reembolso, company:companies(nombre))
      `)
      .not('comprobante_url', 'is', null)
      .order('created_at', { ascending: false })

    setItems((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { fetchPendientes() }, [])

  const handleReview = async (accion: 'aprobado' | 'rechazado') => {
    if (!selected) return
    setProcessing(true)
    try {
      const res = await fetch('/api/benefits/reembolso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userBenefitId: selected.id, accion, notasAdmin: notas }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success(accion === 'aprobado' ? 'Reembolso aprobado' : 'Solicitud rechazada')
      setSelected(null)
      setNotas('')
      fetchPendientes()
    } catch (err: any) {
      toast.error('Error', { description: err.message })
    } finally {
      setProcessing(false)
    }
  }

  const estadoBadge = (estado: string | null) => {
    if (!estado) return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Pendiente</Badge>
    if (estado === 'aprobado') return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Aprobado</Badge>
    return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>
  }

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div>
        <h1 className="text-3xl font-serif font-bold">Reembolsos</h1>
        <p className="text-muted-foreground mt-1">Comprobantes enviados por empleados</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Sin comprobantes</h3>
            <p className="text-muted-foreground text-sm">Cuando un empleado suba un comprobante aparecerá aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <Card key={item.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.benefit?.titulo}</p>
                      {estadoBadge(item.comprobante_estado)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.profile?.nombre} {item.profile?.apellido}
                      </span>
                      <span>{item.benefit?.company?.nombre}</span>
                      {item.benefit?.porcentaje_reembolso != null && (
                        <span className="text-primary font-medium">Cubre {item.benefit.porcentaje_reembolso}%</span>
                      )}
                    </div>
                    {item.notas_admin && (
                      <p className="text-xs text-muted-foreground italic">Nota: {item.notas_admin}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={item.comprobante_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-1" />Ver comprobante
                      </a>
                    </Button>
                    {(!item.comprobante_estado || item.comprobante_estado === 'pendiente') && (
                      <Button size="sm" className="bg-primary hover:bg-accent" onClick={() => { setSelected(item); setNotas('') }}>
                        Revisar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de revisión */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setNotas('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar comprobante</DialogTitle>
            <DialogDescription>
              <strong>{selected?.profile?.nombre} {selected?.profile?.apellido}</strong>
              {' — '}{selected?.benefit?.titulo}
              {selected?.benefit?.porcentaje_reembolso != null && (
                <> · La empresa cubre el <strong>{selected.benefit.porcentaje_reembolso}%</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          {selected?.comprobante_url && (
            <div className="rounded-lg overflow-hidden border border-border max-h-64">
              <img src={selected.comprobante_url} alt="Comprobante" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Notas para el empleado (opcional)</p>
            <Textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Comprobante aceptado / Necesitamos una imagen más clara..."
              rows={2}
              disabled={processing}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelected(null); setNotas('') }} disabled={processing}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleReview('rechazado')} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" />Rechazar</>}
            </Button>
            <Button className="bg-primary hover:bg-accent" onClick={() => handleReview('aprobado')} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Aprobar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
