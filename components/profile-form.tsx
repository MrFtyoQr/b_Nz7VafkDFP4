'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Camera, User, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react'
import { Profile } from '@/lib/types'

export function ProfileForm({ profile }: { profile: Profile }) {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [showPw,    setShowPw]    = useState(false)
  const [showPw2,   setShowPw2]   = useState(false)

  const [form, setForm] = useState({
    nombre:   profile.nombre   || '',
    apellido: profile.apellido || '',
    cargo:    profile.cargo    || '',
    foto_url: profile.foto_url || '',
  })
  const [pw,  setPw]  = useState('')
  const [pw2, setPw2] = useState('')

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  // ── Subir foto ────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagen máximo 5 MB'); return }

    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${profile.id}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('cuponera-assets')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('cuponera-assets')
        .getPublicUrl(path)

      // Auto-guardar foto_url en el perfil inmediatamente
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, foto_url: publicUrl }),
      })
      if (!res.ok) throw new Error('Error al guardar foto en perfil')

      set('foto_url', publicUrl)
      toast.success('Foto de perfil actualizada')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al subir foto', { description: err.message })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Guardar datos del perfil ──────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al guardar'); return }
      toast.success('Perfil actualizado')
      router.refresh()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // ── Cambiar contraseña ────────────────────────────────────────────
  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw !== pw2) { toast.error('Las contraseñas no coinciden'); return }
    if (pw.length < 6) { toast.error('Mínimo 6 caracteres'); return }

    setChangingPw(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pw }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error'); return }
      toast.success('Contraseña actualizada')
      setPw(''); setPw2('')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setChangingPw(false)
    }
  }

  const initials = `${form.nombre[0] ?? ''}${form.apellido[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      {/* Foto de perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Foto de perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden border-2 border-primary/30"
              style={{ background: form.foto_url ? 'transparent' : 'var(--primary)', color: '#fff' }}
            >
              {form.foto_url
                ? <img src={form.foto_url} alt="Foto" className="w-full h-full object-cover" />
                : initials || <User className="h-10 w-10" />}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Esta foto aparecerá en tu credencial digital</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo...</> : <><Camera className="h-4 w-4 mr-2" />Cambiar foto</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos personales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)} required disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" value={form.apellido} onChange={e => set('apellido', e.target.value)} required disabled={saving} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo / Puesto</Label>
              <Input id="cargo" value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ej. Contador, Gerente de Ventas..." disabled={saving} />
            </div>
            <div className="space-y-1">
              <Label>Correo electrónico</Label>
              <Input value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">El correo no puede cambiarse desde aquí</p>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-accent" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : 'Guardar datos'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePw} className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} className="pl-10 pr-10" placeholder="Mínimo 6 caracteres" minLength={6} required disabled={changingPw} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPw2 ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} className="pl-10 pr-10" placeholder="Repite la contraseña" required disabled={changingPw} />
                <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pw2 && pw !== pw2 && <p className="text-xs text-destructive">Las contraseñas no coinciden</p>}
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-accent" disabled={changingPw || (pw2.length > 0 && pw !== pw2)}>
              {changingPw ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Actualizando...</> : 'Actualizar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
