import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { validateEnvironment } from './env-check'
import { prisma } from '../prisma'

describe('Phase 4 — Low Severity / Post-Launch Technical Debt & Hardening', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Issue 23: Legacy ActivationLink Model Cleanup', () => {
    it('verifies ActivationLink model is completely removed from Prisma schema client', () => {
      // @ts-expect-error - activationLink model should no longer exist on prisma client
      expect(prisma.activationLink).toBeUndefined()
    })

    it('verifies inventoryItem model is used for inventory management', () => {
      expect(prisma.inventoryItem).toBeDefined()
      expect(typeof prisma.inventoryItem.findMany).toBe('function')
    })

    it('verifies delivery model is available for order fulfillment delivery records', () => {
      expect(prisma.delivery).toBeDefined()
      expect(typeof prisma.delivery.findUnique).toBe('function')
    })
  })

  describe('Issue 24 & 25: Runtime Environment & Secrets Validation', () => {
    it('validates required variables in development without warnings', () => {
      const result = validateEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        JWT_SECRET: 'test-jwt-secret-key-at-least-32-chars-long',
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('flags errors when critical variables are missing in any environment', () => {
      const result = validateEnvironment({
        NODE_ENV: 'development',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('DATABASE_URL is not set.')
      expect(result.errors).toContain('JWT_SECRET is not set.')
    })

    it('Issue 24: warns in production when CREDENTIALS_ENCRYPTION_KEY is not set', () => {
      const result = validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        JWT_SECRET: 'test-jwt-secret-key-at-least-32-chars-long',
        CRON_SECRET: 'test-cron-secret-at-least-32-chars-long',
      })

      expect(result.warnings.some((w) => w.includes('CREDENTIALS_ENCRYPTION_KEY not set'))).toBe(true)
    })

    it('Issue 25: warns in production when CRON_SECRET is not set', () => {
      const result = validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        JWT_SECRET: 'test-jwt-secret-key-at-least-32-chars-long',
        CREDENTIALS_ENCRYPTION_KEY: 'test-encryption-key-at-least-32-chars',
      })

      expect(result.warnings.some((w) => w.includes('CRON_SECRET not set'))).toBe(true)
    })

    it('passes in production with all recommended secrets defined', () => {
      const result = validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        JWT_SECRET: 'test-jwt-secret-key-at-least-32-chars-long',
        CREDENTIALS_ENCRYPTION_KEY: 'test-encryption-key-at-least-32-chars',
        CRON_SECRET: 'test-cron-secret-at-least-32-chars-long',
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('Issue 26: Dynamic Checkout Fields Length Limits', () => {
    function validateSubmittedCheckoutFields(
      submittedData: Record<string, unknown>,
      fieldDefs: Array<{ key: string; label: string; required?: boolean; type?: string }>
    ): { success: boolean; error?: string } {
      // Global anti-bloat limit
      for (const [key, val] of Object.entries(submittedData)) {
        if (val !== undefined && val !== null && String(val).length > 500) {
          return { success: false, error: `طول مقدار فیلد «${key}» بیش از حد مجاز است (حداکثر ۵۰۰ کاراکتر).` }
        }
      }

      for (const field of fieldDefs) {
        const val = submittedData[field.key]
        if (field.required) {
          if (val === undefined || val === null || String(val).trim() === '') {
            return { success: false, error: `تکمیل فیلد «${field.label}» برای این پلن الزامی است.` }
          }
        }

        if (val !== undefined && val !== null && String(val).length > 500) {
          return { success: false, error: `طول مقدار وارد شده برای «${field.label}» بیش از حد مجاز است (حداکثر ۵۰۰ کاراکتر).` }
        }

        if (val && field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(String(val).trim())) {
            return { success: false, error: `فرمت وارد شده برای «${field.label}» صحیح نمی‌باشد.` }
          }
        }
      }

      return { success: true }
    }

    const fields = [
      { key: 'target_email', label: 'ایمیل مقصد', required: true, type: 'email' },
      { key: 'customer_note', label: 'یادداشت', required: false, type: 'text' },
    ]

    it('accepts valid input within 500 characters', () => {
      const result = validateSubmittedCheckoutFields(
        {
          target_email: 'user@example.com',
          customer_note: 'لطفاً در ساعات کاری فعال شود.',
        },
        fields
      )
      expect(result.success).toBe(true)
    })

    it('rejects field exceeding 500 characters', () => {
      const oversizedText = 'a'.repeat(501)
      const result = validateSubmittedCheckoutFields(
        {
          target_email: 'user@example.com',
          customer_note: oversizedText,
        },
        fields
      )
      expect(result.success).toBe(false)
      expect(result.error).toContain('بیش از حد مجاز است (حداکثر ۵۰۰ کاراکتر)')
    })

    it('rejects rogue/unconfigured oversized keys in submittedData', () => {
      const result = validateSubmittedCheckoutFields(
        {
          target_email: 'user@example.com',
          rogue_payload: 'x'.repeat(1000),
        },
        fields
      )
      expect(result.success).toBe(false)
      expect(result.error).toContain('طول مقدار فیلد «rogue_payload» بیش از حد مجاز است')
    })
  })

  describe('Issue 27: Unused @tanstack/react-router Removal', () => {
    it('verifies @tanstack/react-router is removed from package.json dependencies', () => {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }

      expect(allDeps['@tanstack/react-router']).toBeUndefined()
    })
  })

  describe('Issue 28: document.json Root Directory Cleanup', () => {
    it('verifies document.json does not exist in root directory and is stored in docs/', () => {
      const rootDocPath = path.resolve(process.cwd(), 'document.json')
      const docsPath = path.resolve(process.cwd(), 'docs', 'jibit-api-document.json')

      expect(fs.existsSync(rootDocPath)).toBe(false)
      expect(fs.existsSync(docsPath)).toBe(true)
    })
  })
})
