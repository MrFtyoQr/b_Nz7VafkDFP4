'use client'

import { Profile } from '@/lib/types'
import { Building2, Calendar, Mail, Briefcase, BadgeCheck } from 'lucide-react'

interface Props {
  profile: Profile
}

function calcularTiempo(fechaIngreso: string | null, createdAt: string): string {
  const inicio = fechaIngreso ? new Date(fechaIngreso) : new Date(createdAt)
  const ahora = new Date()
  const meses =
    (ahora.getFullYear() - inicio.getFullYear()) * 12 +
    (ahora.getMonth() - inicio.getMonth())

  if (meses < 1) return 'Recién ingresado'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const años = Math.floor(meses / 12)
  const mesesRest = meses % 12
  if (mesesRest === 0) return `${años} ${años === 1 ? 'año' : 'años'}`
  return `${años} ${años === 1 ? 'año' : 'años'} y ${mesesRest} ${mesesRest === 1 ? 'mes' : 'meses'}`
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase()
}

export function CredencialCard({ profile }: Props) {
  const tiempo = calcularTiempo(
    (profile as any).fecha_ingreso ?? null,
    profile.created_at
  )
  const initials = getInitials(profile.nombre, profile.apellido)
  const cargo = (profile as any).cargo as string | null
  const fotoUrl = (profile as any).foto_url as string | null

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Credencial principal */}
      <div className="w-full max-w-sm">
        {/* Frente de la tarjeta */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: '1.586' }}
        >
          {/* Fondo degradado dorado */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2416 50%, #3D2F18 100%)',
            }}
          />

          {/* Patrón decorativo sutil */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #C9A84C 0px, #C9A84C 1px, transparent 1px, transparent 12px)',
            }}
          />

          {/* Acento dorado superior */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg, #A07830, #C9A84C, #E8D5A3, #C9A84C, #A07830)' }}
          />

          {/* Contenido */}
          <div className="relative z-10 h-full flex flex-col justify-between p-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: '#C9A84C' }}
                >
                  CAMSA
                </p>
                <p className="text-white/60 text-xs tracking-wide">Credencial Corporativa</p>
              </div>
              <div className="flex items-center gap-1">
                <BadgeCheck className="h-4 w-4" style={{ color: '#C9A84C' }} />
                <span className="text-xs" style={{ color: '#C9A84C' }}>Activo</span>
              </div>
            </div>

            {/* Foto + Datos */}
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden"
                style={{
                  border: '2px solid #C9A84C',
                  background: 'rgba(201, 168, 76, 0.15)',
                  color: '#C9A84C',
                }}
              >
                {fotoUrl ? (
                  <img src={fotoUrl} alt={profile.nombre} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-base leading-tight truncate">
                  {profile.nombre} {profile.apellido}
                </h2>
                {cargo && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#C9A84C' }}>
                    {cargo}
                  </p>
                )}
                <p className="text-white/50 text-xs mt-1 truncate">{profile.email}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-white/40" />
                <span className="text-white/40 text-xs">{tiempo} con nosotros</span>
              </div>
              <div
                className="text-xs font-mono opacity-40 text-white"
              >
                #{profile.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalles debajo */}
      <div className="w-full max-w-sm space-y-3">
        <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border">
          <DetailRow
            icon={<Briefcase className="h-4 w-4 text-primary" />}
            label="Cargo"
            value={cargo || 'Sin especificar'}
          />
          <DetailRow
            icon={<Mail className="h-4 w-4 text-primary" />}
            label="Correo"
            value={profile.email}
          />
          <DetailRow
            icon={<Calendar className="h-4 w-4 text-primary" />}
            label="Antigüedad"
            value={tiempo}
          />
          <DetailRow
            icon={<Building2 className="h-4 w-4 text-primary" />}
            label="Empresa"
            value="CAMSA"
          />
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}
