import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { requireAdmin } from '@/lib/auth/admin'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side guard: Strictly verifies that the authenticated user has ADMIN role in DB
  await requireAdmin()

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
