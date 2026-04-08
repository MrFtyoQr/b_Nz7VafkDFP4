'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Ticket, Tag, History, CreditCard, UserCircle } from 'lucide-react'

const navItems = [
  { href: '/mi-cuponera',            label: 'Beneficios', icon: Ticket      },
  { href: '/mi-cuponera/descuentos', label: 'Descuentos', icon: Tag         },
  { href: '/mi-cuponera/credencial', label: 'Credencial', icon: CreditCard  },
  { href: '/mi-cuponera/historial',  label: 'Historial',  icon: History     },
  { href: '/mi-cuponera/perfil',     label: 'Mi Perfil',  icon: UserCircle  },
]

export function EmployeeBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
