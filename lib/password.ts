// Password hashing utilities using bcrypt
// Requirements: 1.5, 13.5

import bcrypt from 'bcrypt'

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 * 10 rounds is a good balance for production
 */
const SALT_ROUNDS = 10

/**
 * Hashes a plaintext password using bcrypt
 * @param password - The plaintext password to hash
 * @returns Promise resolving to the bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }
  
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifies a plaintext password against a bcrypt hash
 * @param password - The plaintext password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false
  }
  
  return bcrypt.compare(password, hash)
}

/**
 * Checks if a string is a valid bcrypt hash
 * @param hash - The string to check
 * @returns True if the string is a valid bcrypt hash format
 */
export function isBcryptHash(hash: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
  return /^\$2[aby]\$\d{2}\$/.test(hash)
}
