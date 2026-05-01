// Session management using iron-session
// Requirements: 1.2, 13.2

import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData } from '@/types'

/**
 * Session configuration for iron-session
 * Sessions are encrypted and stored in cookies
 */
const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'structura_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 60, // 30 minutes in seconds
    path: '/',
  },
}

/**
 * Session timeout in milliseconds (30 minutes)
 */
const SESSION_TIMEOUT = 30 * 60 * 1000

/**
 * Gets the current session from the encrypted cookie
 * @returns Promise resolving to the session object
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

/**
 * Creates a new session for a user
 * @param userId - The user's ID
 * @param role - The user's role
 * @returns Promise resolving to the session data
 */
export async function createSession(userId: string, role: SessionData['role']): Promise<SessionData> {
  const session = await getSession()
  
  const now = Date.now()
  const sessionData: SessionData = {
    userId,
    role,
    createdAt: now,
    expiresAt: now + SESSION_TIMEOUT,
  }
  
  // Store session data in encrypted cookie
  session.userId = sessionData.userId
  session.role = sessionData.role
  session.createdAt = sessionData.createdAt
  session.expiresAt = sessionData.expiresAt
  
  await session.save()
  
  return sessionData
}

/**
 * Gets the current session data if valid, null otherwise
 * @returns Promise resolving to session data or null
 */
export async function getSessionData(): Promise<SessionData | null> {
  const session = await getSession()
  
  // Check if session exists
  if (!session.userId || !session.role || !session.createdAt || !session.expiresAt) {
    return null
  }
  
  // Check if session has expired
  const now = Date.now()
  if (now > session.expiresAt) {
    await destroySession()
    return null
  }
  
  return {
    userId: session.userId,
    role: session.role,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }
}

/**
 * Updates the session expiration time (refreshes the session)
 * @returns Promise resolving to the updated session data or null if no session
 */
export async function refreshSession(): Promise<SessionData | null> {
  const session = await getSession()
  
  if (!session.userId || !session.role) {
    return null
  }
  
  const now = Date.now()
  session.expiresAt = now + SESSION_TIMEOUT
  
  await session.save()
  
  return {
    userId: session.userId,
    role: session.role,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }
}

/**
 * Destroys the current session (logout)
 * @returns Promise that resolves when session is destroyed
 */
export async function destroySession(): Promise<void> {
  const session = await getSession()
  session.destroy()
}

/**
 * Checks if a session is expired
 * @param sessionData - The session data to check
 * @returns True if the session is expired
 */
export function isSessionExpired(sessionData: SessionData): boolean {
  return Date.now() > sessionData.expiresAt
}

/**
 * Validates that the session secret is properly configured
 * @throws Error if session secret is missing or too short
 */
export function validateSessionConfig(): void {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set')
  }
  
  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long')
  }
}
