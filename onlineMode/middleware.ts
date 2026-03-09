import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. If no user and trying to access protected routes, redirect to login
  // For this app, we'll protect /authority and maybe some others later
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
  
  if (!user && !isAuthPage && (request.nextUrl.pathname.startsWith('/authority') || request.nextUrl.pathname.startsWith('/ai'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. If user exists and is on /login or /signup, redirect to dashboard based on role
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
