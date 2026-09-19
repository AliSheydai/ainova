import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

let hasWarnedMissingEncryptionKey = false

function getEncryptionKey(): Buffer {
  if (process.env.NODE_ENV === 'production' && !process.env.CREDENTIALS_ENCRYPTION_KEY) {
    if (!hasWarnedMissingEncryptionKey) {
      console.warn('WARNING: CREDENTIALS_ENCRYPTION_KEY not set, falling back to JWT_SECRET')
      hasWarnedMissingEncryptionKey = true
    }
  }

  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY || process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      'CRITICAL SECURITY ERROR: Neither CREDENTIALS_ENCRYPTION_KEY nor JWT_SECRET environment variable is defined!'
    )
  }
  return crypto.createHash('sha256').update(secret).digest()
}

function getFallbackKeys(): Buffer[] {
  const fallbackSecrets = [
    process.env.CREDENTIALS_ENCRYPTION_FALLBACK_KEY,
    process.env.JWT_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim().length > 0))

  return fallbackSecrets.map((s) => crypto.createHash('sha256').update(s).digest())
}

/**
 * Checks if a string is already encrypted in the iv_hex:auth_tag_hex:encrypted_hex format.
 */
export function isEncryptedCredential(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const parts = text.split(':')
  if (parts.length !== 3) return false
  const [ivHex, authTagHex, cipherHex] = parts
  const isHex = (str: string) => /^[0-9a-fA-F]+$/.test(str)
  return (
    ivHex.length === IV_LENGTH * 2 &&
    isHex(ivHex) &&
    authTagHex.length === 32 &&
    isHex(authTagHex) &&
    cipherHex.length > 0 &&
    isHex(cipherHex)
  )
}

/**
 * Encrypts a sensitive string (e.g., account password) using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:encrypted_hex
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return ''
  if (isEncryptedCredential(plainText)) return plainText
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypts a string encrypted with encryptCredential.
 * Tries the primary encryption key first, followed by configured fallback keys (e.g. during key rotation).
 * If the string does not match the encrypted format, returns the raw string for backwards compatibility.
 */
export function decryptCredential(encryptedText: string): string {
  if (!encryptedText) return ''
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    // Not encrypted in standard format; return as-is
    return encryptedText
  }

  const [ivHex, authTagHex, cipherTextHex] = parts
  const isHex = (str: string) => /^[0-9a-fA-F]+$/.test(str)
  if (
    ivHex.length !== IV_LENGTH * 2 ||
    !isHex(ivHex) ||
    authTagHex.length !== 32 ||
    !isHex(authTagHex) ||
    !isHex(cipherTextHex)
  ) {
    return encryptedText
  }

  const keysToTry: Buffer[] = [getEncryptionKey(), ...getFallbackKeys()]

  for (const key of keysToTry) {
    try {
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch {
      // Decryption failed with this key (e.g. auth tag mismatch), try next key
      continue
    }
  }

  console.error('Failed to decrypt credential with primary and fallback keys')
  return encryptedText
}

/**
 * Masks a secret string for logging or UI display (e.g. •••••••• or ab••••yz)
 */
export function maskCredential(secret: string): string {
  if (!secret) return '••••••••'
  if (secret.length <= 4) return '••••••••'
  return `${secret.slice(0, 2)}••••${secret.slice(-2)}`
}

/**
 * Detects any encrypted credential (iv:authTag:cipher) embedded within a larger string
 * (e.g. "ایمیل: ... | رمزعبور: a1...:b2...:c3...") and replaces it with decrypted plain text.
 */
export function decryptEmbeddedCredentials(text: string): string {
  if (!text || typeof text !== 'string') return text
  return text.replace(/\b([0-9a-fA-F]{24}:[0-9a-fA-F]{32}:[0-9a-fA-F]+)\b/g, (match) => {
    try {
      return decryptCredential(match)
    } catch {
      return match
    }
  })
}
