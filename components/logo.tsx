import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}

export function Logo({ className, size = 'md', showTagline = false }: LogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn('font-serif font-bold tracking-tight text-foreground', sizes[size])}>
          CAMSA
        </span>
        <span className={cn(
          'font-serif font-light text-primary',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-xl'
        )}>
          Cuponera
        </span>
      </div>
      {showTagline && (
        <span className="text-xs text-muted-foreground mt-0.5">
          Tus beneficios, en un solo lugar.
        </span>
      )}
    </div>
  )
}
