import { createClient } from '@/lib/supabase/server'
import { BenefitForm } from '@/components/benefit-form'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarCuponPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: benefit } = await supabase
    .from('benefits')
    .select('*')
    .eq('id', id)
    .single()

  if (!benefit) {
    notFound()
  }

  return <BenefitForm benefit={benefit} />
}
