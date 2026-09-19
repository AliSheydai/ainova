/**
 * Production environment variables validation and health check.
 * Ensures critical secrets are configured before servicing requests.
 */

export interface EnvValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

export function validateEnvironment(env: Record<string, string | undefined> = process.env): EnvValidationResult {
  const isProd = env.NODE_ENV === 'production'
  const warnings: string[] = []
  const errors: string[] = []

  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set.')
  }

  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set.')
  }

  if (isProd) {
    if (!env.CREDENTIALS_ENCRYPTION_KEY) {
      warnings.push('WARNING: CREDENTIALS_ENCRYPTION_KEY not set, falling back to JWT_SECRET')
    }

    if (!env.CRON_SECRET) {
      warnings.push('WARNING: CRON_SECRET not set. Scheduled cron jobs will fail in production.')
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}

// Automatically warn on startup in production if critical variables are missing
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
  const { warnings, errors } = validateEnvironment()
  for (const err of errors) {
    console.error(`[CRITICAL CONFIG ERROR] ${err}`)
  }
  for (const warn of warnings) {
    console.warn(`[CONFIG WARNING] ${warn}`)
  }
}
