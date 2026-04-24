import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
  const isPublicAIPage = request.nextUrl.pathname.startsWith('/ai/report')
  
  if (!user && !isAuthPage && !isPublicAIPage && (request.nextUrl.pathname.startsWith('/authority') || request.nextUrl.pathname.startsWith('/ai'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    const role = user.user_metadata?.role
    if (role === 'authority' || role === 'community_supporter') {
      return NextResponse.redirect(new URL('/authority/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets like icons, manifests, etc.
     * - Static images, fonts, and scripts
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|mjs|woff2?|otf|ttf|svg|png|jpg|jpeg|gif|webp|ico|json|txt)$).*)',
  ],
}
