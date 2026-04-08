import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BenefitCard } from '@/components/benefit-card'
import { Empty } from '@/components/ui/empty'
import { Ticket } from 'lucide-react'

async function getMyBenefits(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_benefits')
    .select(`
      *,
      benefit:benefits(*, company:companies(*))
    `)
    .eq('user_id', userId)
    .eq('estatus', 'activo')
    .order('fecha_asignacion', { ascending: false })

  return data || []
}

export default async function MiCuponeraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const benefits = await getMyBenefits(user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Mis Beneficios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cupones y descuentos disponibles para ti
        </p>
      </div>

      {/* Benefits Grid */}
      {benefits.length === 0 ? (
        <Empty
          icon={<Ticket className="h-10 w-10" />}
          title="Sin beneficios activos"
          description="Aún no tienes cupones asignados. Tu administrador te notificará cuando haya nuevos beneficios."
        />
      ) : (
        <div className="grid gap-4">
          {benefits.map((ub: any) => (
            <BenefitCard
              key={ub.id}
              userBenefitId={ub.id}
              benefit={ub.benefit}
              estatus={ub.estatus}
              fechaAsignacion={ub.fecha_asignacion}
              comprobanteUrl={ub.comprobante_url}
              comprobanteEstado={ub.comprobante_estado}
            />
          ))}
        </div>
      )}
    </div>
  )
}
