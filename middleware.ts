// Authentication middleware for protected routes
// Requirements: 1.4

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData } from '@/types'

/**
 * Session configuration (must match lib/session.ts)
 */
const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'structura_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 30 * 60,
    path: '/',
  },
}

/**
 * Protected route patterns that require authentication
 */
const protectedRoutes = [
  '/student',
  '/admin',
  '/api/events',
  '/api/documents',
  '/api/checklists',
  '/api/budget',
  '/api/users',
  '/api/audit',
]

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  '/',
  '/sign-in',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
]

/**
 * Role-based route access control
 */
const roleRoutes = {
  student: ['/student'],
  admin: ['/admin'],
}

/**
 * Checks if a path matches any of the given patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => path.startsWith(pattern))
}

/**
 * Middleware function that runs on every request
 * Enforces authentication and role-based access control
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (matchesPattern(pathname, publicRoutes)) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (matchesPattern(pathname, protectedRoutes)) {
    try {
      // Get session from cookie
      const response = NextResponse.next()
      const session = await getIronSession<SessionData>(
        request,
        response,
        sessionOptions
      )

      // Check if session exists and is valid
      if (!session.userId || !session.role || !session.expiresAt) {
        // No valid session, redirect to sign-in
        const signInUrl = new URL('/sign-in', request.url)
        signInUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(signInUrl)
      }

      // Check if session is expired
      const now = Date.now()
      if (now > session.expiresAt) {
        // Session expired, redirect to sign-in
        const signInUrl = new URL('/sign-in', request.url)
        signInUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(signInUrl)
      }

      // Check role-based access

      // Student portal: organizer and officer both belong here
      if (pathname.startsWith('/student') && !['organizer', 'officer'].includes(session.role)) {
        // Admins go to their own portal
        if (session.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }

      // Admin portal: admin only
      if (pathname.startsWith('/admin') && session.role !== 'admin') {
        // Organizers and officers go to the student portal
        if (session.role === 'organizer' || session.role === 'officer') {
          return NextResponse.redirect(new URL('/student/dashboard', request.url))
        }
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }

      // Session is valid, allow request
      return response
    } catch (error) {
      // Error reading session, redirect to sign-in
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  // Allow all other routes
  return NextResponse.next()
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
