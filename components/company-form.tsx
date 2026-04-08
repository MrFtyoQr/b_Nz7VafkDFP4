'use client'

import { useState, useRef } from 'react'
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
import { Loader2, ArrowLeft, Building2, ImagePlus, X } from 'lucide-react'
import Link from 'next/link'
import { Company, CompanyCategory, CATEGORY_INFO } from '@/lib/types'

interface CompanyFormProps {
  company?: Company
}

const categories: CompanyCategory[] = [
  'salud','entretenimiento','alimentacion','fitness','educacion','servicios','tecnologia','otros',
]

export function CompanyForm({ company }: CompanyFormProps) {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)
  const isEditing = !!company

  const [loading,   setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData,  setFormData]  = useState({
    nombre:       company?.nombre       || '',
    logo_url:     company?.logo_url     || '',
    categoria:    company?.categoria    || 'otros',
    descripcion:  company?.descripcion  || '',
    direccion:    company?.direccion    || '',
    fecha_inicio: company?.fecha_inicio || new Date().toISOString().split('T')[0],
    fecha_fin:    company?.fecha_fin    || '',
    activo:       company?.activo       ?? true,
  })

  const set = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }))

  // ── Subir logo al Storage ─────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagen máximo 5 MB'); return }

    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      // Nombre único por empresa (o timestamp si es nueva)
      const slug = formData.nombre
        ? formData.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40)
        : `empresa-${Date.now()}`
      const path = `logos/${slug}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('cuponera-assets')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('cuponera-assets')
        .getPublicUrl(path)

      set('logo_url', publicUrl)
      toast.success('Logo subido correctamente')
    } catch (err: any) {
      toast.error('Error al subir logo', { description: err.message })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Guardar empresa ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...formData, fecha_fin: formData.fecha_fin || null }
      const url    = isEditing ? `/api/companies/${company.id}` : '/api/companies'
      const method = isEditing ? 'PATCH' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al guardar'); return }

      toast.success(isEditing ? 'Empresa actualizada' : 'Empresa creada')
      router.push('/admin/empresas')
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
          <Link href="/admin/empresas"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold">{isEditing ? 'Editar Empresa' : 'Nueva Empresa'}</h1>
          <p className="text-muted-foreground">{isEditing ? 'Modifica los datos del convenio' : 'Registra una nueva empresa con convenio'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Información de la Empresa</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Logo de la empresa</Label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted shrink-0 overflow-hidden">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading || loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || loading}
                  >
                    {uploading
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo...</>
                      : <><ImagePlus className="h-4 w-4 mr-2" />Subir logo</>}
                  </Button>
                  {formData.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => set('logo_url', '')}
                      disabled={uploading || loading}
                    >
                      <X className="h-4 w-4 mr-1" />Quitar logo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG o SVG — máx. 5 MB</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="McDonald's"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría *</Label>
                <Select value={formData.categoria} onValueChange={v => set('categoria', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_INFO[cat].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={e => set('direccion', e.target.value)}
                placeholder="Av. Insurgentes Sur 1234, CDMX"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción del convenio</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Describe los beneficios y términos del convenio..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Inicio del convenio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={e => set('fecha_inicio', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Vencimiento del convenio</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={e => set('fecha_fin', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div>
                <Label htmlFor="activo" className="text-base">Convenio activo</Label>
                <p className="text-sm text-muted-foreground">Los convenios inactivos no mostrarán sus beneficios</p>
              </div>
              <Switch id="activo" checked={formData.activo} onCheckedChange={v => set('activo', v)} />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-accent" disabled={loading || uploading}>
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                  : isEditing ? 'Guardar cambios' : 'Crear empresa'}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
