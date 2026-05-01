// Property-based tests for password hashing
// Feature: structura, Property 1: Password Security
// Requirements: 1.1, 1.5, 13.5

import { describe, test, expect } from 'vitest'
import fc from 'fast-check'
import { hashPassword, verifyPassword, isBcryptHash } from './password'

describe('Password Security', () => {
  /**
   * **Validates: Requirements 1.5, 13.5**
   * Property 1: Password Security
   * For any user registration or password update, the stored password must be
   * a bcrypt hash and not the plaintext password.
   */
  test('Property 1: passwords are always hashed with bcrypt and never stored as plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (password) => {
          // Hash the password
          const hash = await hashPassword(password)
          
          // Hash should not equal plaintext password
          expect(hash).not.toBe(password)
          
          // Hash should be a valid bcrypt hash format
          expect(isBcryptHash(hash)).toBe(true)
          expect(hash).toMatch(/^\$2[aby]\$/)
          
          // Should be able to verify the password with the hash
          const isValid = await verifyPassword(password, hash)
          expect(isValid).toBe(true)
          
          // Wrong password should not verify
          const wrongPassword = password + 'wrong'
          const isInvalid = await verifyPassword(wrongPassword, hash)
          expect(isInvalid).toBe(false)
        }
      ),
      { numRuns: 20 } // Reduced runs due to bcrypt computational cost
    )
  }, 30000) // 30 second timeout for bcrypt operations

  // Unit tests for specific edge cases
  describe('Unit Tests', () => {
    test('hashes a simple password correctly', async () => {
      const password = 'password123'
      const hash = await hashPassword(password)
      
      expect(hash).not.toBe(password)
      expect(isBcryptHash(hash)).toBe(true)
      expect(await verifyPassword(password, hash)).toBe(true)
    })

    test('different passwords produce different hashes', async () => {
      const password1 = 'password123'
      const password2 = 'password456'
      
      const hash1 = await hashPassword(password1)
      const hash2 = await hashPassword(password2)
      
      expect(hash1).not.toBe(hash2)
    })

    test('same password produces different hashes (salt)', async () => {
      const password = 'password123'
      
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      // Hashes should be different due to random salt
      expect(hash1).not.toBe(hash2)
      
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true)
      expect(await verifyPassword(password, hash2)).toBe(true)
    })

    test('rejects empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty')
    })

    test('verifyPassword returns false for empty inputs', async () => {
      const hash = await hashPassword('password123')
      
      expect(await verifyPassword('', hash)).toBe(false)
      expect(await verifyPassword('password123', '')).toBe(false)
    })

    test('verifyPassword returns false for invalid hash format', async () => {
      expect(await verifyPassword('password123', 'not-a-hash')).toBe(false)
    })

    test('handles special characters in passwords', async () => {
      const password = 'p@ssw0rd!#$%^&*()'
      const hash = await hashPassword(password)
      
      expect(await verifyPassword(password, hash)).toBe(true)
    })

    test('handles unicode characters in passwords', async () => {
      const password = 'пароль密码🔒'
      const hash = await hashPassword(password)
      
      expect(await verifyPassword(password, hash)).toBe(true)
    })

    test('isBcryptHash correctly identifies bcrypt hashes', () => {
      expect(isBcryptHash('$2a$10$abcdefghijklmnopqrstuv')).toBe(true)
      expect(isBcryptHash('$2b$10$abcdefghijklmnopqrstuv')).toBe(true)
      expect(isBcryptHash('$2y$10$abcdefghijklmnopqrstuv')).toBe(true)
      expect(isBcryptHash('not-a-hash')).toBe(false)
      expect(isBcryptHash('$1a$10$abcdefghijklmnopqrstuv')).toBe(false)
      expect(isBcryptHash('')).toBe(false)
    })
  })
})
