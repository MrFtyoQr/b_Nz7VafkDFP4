'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Building2, Calendar, CheckCircle, Upload, Clock, XCircle, Image } from 'lucide-react'
import { Benefit, BenefitStatus, ComprobanteEstado, BENEFIT_TYPE_INFO, STATUS_INFO } from '@/lib/types'

interface BenefitCardProps {
  userBenefitId: string
  benefit: Benefit & { company: { nombre: string; logo_url: string | null } }
  estatus: BenefitStatus
  fechaAsignacion: string
  comprobanteUrl?: string | null
  comprobanteEstado?: ComprobanteEstado | null
  showReportButton?: boolean
}

const COMPROBANTE_INFO: Record<ComprobanteEstado, { label: string; color: string; icon: typeof CheckCircle }> = {
  pendiente: { label: 'En revisión',  color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock      },
  aprobado:  { label: 'Aprobado',     color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  rechazado: { label: 'Rechazado',    color: 'bg-red-100 text-red-800 border-red-300',       icon: XCircle     },
}

export function BenefitCard({
  userBenefitId, benefit, estatus, fechaAsignacion,
  comprobanteUrl, comprobanteEstado, showReportButton = true,
}: BenefitCardProps) {
  const [loading, setLoading]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [open, setOpen]           = useState(false)
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const isActive       = estatus === 'activo'
  const isExpiringSoon = benefit.fecha_vencimiento &&
    new Date(benefit.fecha_vencimiento) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // ── Reporte de uso simple (sin comprobante) ─────────────────────────
  const handleReportUsage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/benefits/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userBenefitId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Beneficio reportado como usado', {
        description: 'Gracias por informarnos. El cupón ha sido desactivado.',
      })
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al reportar', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  // ── Upload comprobante ──────────────────────────────────────────────
  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede pesar más de 5 MB'); return }

    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `comprobantes/${userBenefitId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('cuponera-assets')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('cuponera-assets')
        .getPublicUrl(path)

      const res = await fetch('/api/benefits/comprobante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userBenefitId, comprobanteUrl: publicUrl }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      toast.success('Comprobante enviado', {
        description: 'Tu comprobante está en revisión. Te notificaremos cuando sea aprobado.',
      })
      router.refresh()
    } catch (err: any) {
      toast.error('Error al subir comprobante', { description: err.message })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card className={`overflow-hidden transition-all ${isActive ? 'border-primary/30 card-hover' : 'opacity-75'}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border">
              {benefit.company.logo_url
                ? <img src={benefit.company.logo_url} alt={benefit.company.nombre} className="w-8 h-8 object-contain" />
                : <Building2 className="h-5 w-5 text-muted-foreground" />}
            </div>
            <span className="text-sm font-medium text-muted-foreground">{benefit.company.nombre}</span>
          </div>
          <Badge variant="outline" className={STATUS_INFO[estatus]?.color}>{STATUS_INFO[estatus]?.label}</Badge>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif font-semibold text-lg leading-tight">{benefit.titulo}</h3>
              <Badge variant="outline" className={BENEFIT_TYPE_INFO[benefit.tipo]?.color}>
                {BENEFIT_TYPE_INFO[benefit.tipo]?.label}
              </Badge>
            </div>
            {benefit.valor && <p className="text-primary font-bold text-xl mt-1">{benefit.valor}</p>}
            {benefit.requiere_comprobante && benefit.porcentaje_reembolso != null && (
              <p className="text-sm text-muted-foreground mt-1">
                La empresa cubre el <span className="font-semibold text-primary">{benefit.porcentaje_reembolso}%</span> del costo
              </p>
            )}
          </div>

          {benefit.descripcion && (
            <p className="text-sm text-muted-foreground leading-relaxed">{benefit.descripcion}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {benefit.fecha_vencimiento && (
              <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-amber-600' : ''}`}>
                <Calendar className="h-3 w-3" />
                <span>Vence: {new Date(benefit.fecha_vencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Estado del comprobante (si aplica) */}
          {comprobanteEstado && (() => {
            const info = COMPROBANTE_INFO[comprobanteEstado]
            const Icon = info.icon
            return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${info.color}`}>
                <Icon className="h-4 w-4" />
                <span>Comprobante: {info.label}</span>
                {comprobanteUrl && (
                  <a href={comprobanteUrl} target="_blank" rel="noopener noreferrer" className="ml-auto underline flex items-center gap-1">
                    <Image className="h-3 w-3" />Ver
                  </a>
                )}
              </div>
            )
          })()}
        </div>

        {/* Acciones */}
        {isActive && showReportButton && (
          <div className="p-4 pt-0 space-y-2">

            {/* Beneficio con comprobante */}
            {benefit.requiere_comprobante ? (
              <>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadComprobante} />
                {!comprobanteEstado && (
                  <Button
                    className="w-full bg-primary hover:bg-accent"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo...</>
                      : <><Upload className="h-4 w-4 mr-2" />Subir comprobante de pago</>}
                  </Button>
                )}
                {comprobanteEstado === 'pendiente' && (
                  <p className="text-center text-xs text-muted-foreground py-1">
                    Comprobante en revisión — el admin te notificará
                  </p>
                )}
                {comprobanteEstado === 'rechazado' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />Volver a subir comprobante
                  </Button>
                )}
              </>
            ) : (
              /* Beneficio sin comprobante: reporte directo */
              <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-accent">
                    <CheckCircle className="h-4 w-4 mr-2" />Reportar Uso
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar uso del beneficio</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>¿Confirmas que utilizaste <strong>{benefit.titulo}</strong>?</p>
                      <p className="text-amber-600">Una vez reportado, el cupón se marcará como usado y no podrá reactivarse.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReportUsage} disabled={loading} className="bg-primary hover:bg-accent">
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reportando...</> : <><CheckCircle className="mr-2 h-4 w-4" />Confirmar Uso</>}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
