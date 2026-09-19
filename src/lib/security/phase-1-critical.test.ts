import { describe, it, expect, beforeAll } from 'vitest'
import { encryptCredential, decryptCredential, isEncryptedCredential } from './crypto'
import crypto from 'node:crypto'

describe('Phase 1 Critical Security Fixes', () => {
  beforeAll(() => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = '4feea12e512896d97ffe4537194460a91564cb65f18e8c34c1c29c16b5b31369'
    process.env.CREDENTIALS_ENCRYPTION_FALLBACK_KEY = 'super-secret-jwt-key-for-google-ai-pro-activation-service-2026'
    process.env.JWT_SECRET = '6c2a46ca4883810f95c664da0f46a83b3ce2839cc8e13dcdf1030dbf2e04a01d'
  })
  describe('Issue 1 & 9: Encryption Key & Credentials Decryption Fallback', () => {
    it('encrypts and decrypts correctly with the primary key', () => {
      const secret = 'MyUltraSecretPassword123!@#'
      const encrypted = encryptCredential(secret)

      expect(isEncryptedCredential(encrypted)).toBe(true)
      expect(encrypted).not.toBe(secret)

      const decrypted = decryptCredential(encrypted)
      expect(decrypted).toBe(secret)
    })

    it('decrypts credentials encrypted with a fallback key', () => {
      // Simulate an old credential encrypted with fallback key
      const fallbackKey = crypto
        .createHash('sha256')
        .update(process.env.CREDENTIALS_ENCRYPTION_FALLBACK_KEY || 'fallback-key')
        .digest()
      const iv = crypto.randomBytes(12)
      const cipher = crypto.createCipheriv('aes-256-gcm', fallbackKey, iv)
      const plaintext = 'LegacyGmailPass_2026'

      let enc = cipher.update(plaintext, 'utf8', 'hex')
      enc += cipher.final('hex')
      const tag = cipher.getAuthTag().toString('hex')
      const legacyEncryptedString = `${iv.toString('hex')}:${tag}:${enc}`

      expect(isEncryptedCredential(legacyEncryptedString)).toBe(true)

      // decryptCredential should try primary, fail, then try fallback key and succeed
      const decrypted = decryptCredential(legacyEncryptedString)
      expect(decrypted).toBe(plaintext)
    })

    it('returns raw text or does not crash on corrupt cipher text', () => {
      const corruptEncrypted = '0123456789abcdef01234567:0123456789abcdef0123456789abcdef:badcipher'
      const res = decryptCredential(corruptEncrypted)
      expect(res).toBe(corruptEncrypted)
    })
  })
})
