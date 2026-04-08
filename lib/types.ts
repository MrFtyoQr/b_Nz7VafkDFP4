export type UserRole = 'admin' | 'empleado'

export type BenefitType = 'descuento' | 'pago_cubierto' | 'informativo'

export type BenefitStatus = 'activo' | 'usado' | 'vencido' | 'desactivado'

export type CompanyCategory = 
  | 'salud' 
  | 'entretenimiento' 
  | 'alimentacion' 
  | 'fitness' 
  | 'educacion' 
  | 'servicios' 
  | 'tecnologia' 
  | 'otros'

export type AssignmentType = 'individual' | 'grupo' | 'todos'

export interface Profile {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: UserRole
  activo: boolean
  cargo: string | null
  foto_url: string | null
  fecha_ingreso: string | null
  created_at: string
  updated_at: string
}

export type ComprobanteEstado = 'pendiente' | 'aprobado' | 'rechazado'

export interface Company {
  id: string
  nombre: string
  logo_url: string | null
  categoria: CompanyCategory
  descripcion: string | null
  direccion: string | null
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Benefit {
  id: string
  titulo: string
  descripcion: string | null
  tipo: BenefitType
  valor: string | null
  imagen_url: string | null
  company_id: string
  fecha_vencimiento: string | null
  activo: boolean
  asignado_a: AssignmentType
  requiere_comprobante: boolean
  porcentaje_reembolso: number | null
  created_at: string
  updated_at: string
  // Joined data
  company?: Company
}

export interface UserBenefit {
  id: string
  user_id: string
  benefit_id: string
  estatus: BenefitStatus
  fecha_asignacion: string
  fecha_uso: string | null
  reportado_por_usuario: boolean
  notas: string | null
  comprobante_url: string | null
  comprobante_estado: ComprobanteEstado | null
  notas_admin: string | null
  created_at: string
  updated_at: string
  // Joined data
  benefit?: Benefit
  profile?: Profile
}

// Dashboard stats
export interface DashboardStats {
  totalEmpleados: number
  cuponesActivos: number
  cuponesUsadosMes: number
  empresasActivas: number
}

// Category display info
export const CATEGORY_INFO: Record<CompanyCategory, { label: string; icon: string }> = {
  salud: { label: 'Salud', icon: 'Heart' },
  entretenimiento: { label: 'Entretenimiento', icon: 'Film' },
  alimentacion: { label: 'Alimentación', icon: 'UtensilsCrossed' },
  fitness: { label: 'Fitness', icon: 'Dumbbell' },
  educacion: { label: 'Educación', icon: 'GraduationCap' },
  servicios: { label: 'Servicios', icon: 'Wrench' },
  tecnologia: { label: 'Tecnología', icon: 'Laptop' },
  otros: { label: 'Otros', icon: 'MoreHorizontal' },
}

export const BENEFIT_TYPE_INFO: Record<BenefitType, { label: string; color: string }> = {
  descuento: { label: 'Descuento', color: 'bg-blue-100 text-blue-800' },
  pago_cubierto: { label: 'Pago Cubierto', color: 'bg-green-100 text-green-800' },
  informativo: { label: 'Informativo', color: 'bg-amber-100 text-amber-800' },
}

export const STATUS_INFO: Record<BenefitStatus, { label: string; color: string }> = {
  activo: { label: 'Activo', color: 'bg-green-100 text-green-800 border-green-300' },
  usado: { label: 'Usado', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800 border-red-300' },
  desactivado: { label: 'Desactivado', color: 'bg-gray-100 text-gray-500 border-gray-300' },
}
