import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const secret =
    process.env.CREDENTIALS_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'fallback-secret-at-least-32-chars-long-for-google-ai-pro'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a sensitive string (e.g., account password) using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:encrypted_hex
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return ''
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
 * If the string does not match the encrypted format, returns the raw string for backwards compatibility.
 */
export function decryptCredential(encryptedText: string): string {
  if (!encryptedText) return ''
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    // Not encrypted in standard format; return as-is
    return encryptedText
  }

  try {
    const [ivHex, authTagHex, cipherTextHex] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt credential:', error)
    return encryptedText
  }
}

/**
 * Masks a secret string for logging or UI display (e.g. •••••••• or ab••••yz)
 */
export function maskCredential(secret: string): string {
  if (!secret) return '••••••••'
  if (secret.length <= 4) return '••••••••'
  return `${secret.slice(0, 2)}••••${secret.slice(-2)}`
}
