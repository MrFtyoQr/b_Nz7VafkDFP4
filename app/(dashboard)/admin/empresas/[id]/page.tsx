import { createClient } from '@/lib/supabase/server'
import { CompanyForm } from '@/components/company-form'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarEmpresaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (!company) {
    notFound()
  }

  return <CompanyForm company={company} />
}
