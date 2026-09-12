'use client'

import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    router.replace('/login')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='خروج از حساب کاربری'
      desc='آیا برای خروج از حساب کاربری خود اطمینان دارید؟ برای دسترسی مجدد باید دوباره وارد شوید.'
      confirmText='خروج'
      cancelBtnText='انصراف'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm text-start'
    />
  )
}
