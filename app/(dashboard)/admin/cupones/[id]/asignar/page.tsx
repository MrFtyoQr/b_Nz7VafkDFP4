import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AssignBenefitForm } from '@/components/assign-benefit-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AsignarCuponPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: benefit } = await supabase
    .from('benefits')
    .select('*, company:companies(nombre)')
    .eq('id', id)
    .single()

  if (!benefit) {
    notFound()
  }

  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'empleado')
    .eq('activo', true)
    .order('nombre')

  const { data: existingAssignments } = await supabase
    .from('user_benefits')
    .select('user_id')
    .eq('benefit_id', id)

  const assignedUserIds = existingAssignments?.map(a => a.user_id) || []

  return (
    <AssignBenefitForm 
      benefit={benefit} 
      employees={employees || []} 
      assignedUserIds={assignedUserIds}
    />
  )
}
