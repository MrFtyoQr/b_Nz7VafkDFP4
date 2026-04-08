import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Excluir rutas estáticas y archivos públicos:
     * - _next/static, _next/image
     * - favicon.ico, manifest.json, robots.txt, sitemap.xml
     * - /icons/*, /images/*
     * - extensiones: svg, png, jpg, jpeg, gif, webp, ico, json
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|robots\\.txt|sitemap\\.xml|icons/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}
