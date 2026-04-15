'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Credenciales incorrectas', {
          description: 'Verifica tu correo y contraseña e intenta de nuevo.',
        })
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('rol')
          .eq('id', data.user.id)
          .single()

        toast.success('Bienvenido', {
          description: 'Has iniciado sesión correctamente.',
        })

        if (profile?.rol === 'admin') {
          router.push('/admin')
        } else {
          router.push('/mi-cuponera')
        }
        router.refresh()
      }
    } catch {
      toast.error('Error al iniciar sesión', {
        description: 'Por favor intenta de nuevo más tarde.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient gold blurs */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
      <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-primary/6 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" showTagline />
        </div>

        {/* Card glassmorphism + gold glow */}
        <div className="bg-card/85 backdrop-blur-md border border-primary/25 rounded-2xl shadow-xl p-8 border-gold-glow">
          {/* Separador dorado superior */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-7" />

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Correo */}
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                id="email"
                type="email"
                placeholder="Correo corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-background/60 border-border/70 focus:border-primary/60 transition-all duration-200"
                required
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-background/60 border-border/70 focus:border-primary/60 transition-all duration-200"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Olvidé contraseña */}
            <div className="flex justify-end">
              <Link
                href="/recuperar-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón */}
            <Button
              type="submit"
              className="w-full h-11 mt-1 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-medium tracking-wide transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:shadow-primary/25"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Separador dorado inferior */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-7" />
        </div>
      </div>
    </div>
  )
}
