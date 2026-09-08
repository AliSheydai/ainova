'use client'

import Link from 'next/link'
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { SignOutDialog } from '@/components/sign-out-dialog'

import { useEffect, useState } from 'react'

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useDialogState()
  const [currentUser, setCurrentUser] = useState<{ name: string | null; phone: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(() => null)
  }, [])

  const displayName = currentUser?.name || currentUser?.phone || user.name || 'کاربر'
  const subText = currentUser?.name ? currentUser.phone : ''
  const initials = displayName.charAt(0)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='default'
                className='h-10 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center'
              >
                <Avatar className='size-7 shrink-0 rounded-lg'>
                  <AvatarImage src={user.avatar} alt={displayName} />
                  <AvatarFallback className='rounded-lg text-xs bg-primary text-primary-foreground'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-1 items-center overflow-hidden text-start group-data-[collapsible=icon]:hidden'>
                  <span className='truncate whitespace-nowrap text-sm font-medium'>
                    {displayName}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl p-1.5 shadow-lg'
              side='top'
              align='end'
              sideOffset={8}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage src={user.avatar} alt={displayName} />
                    <AvatarFallback className='rounded-lg bg-primary text-primary-foreground'>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-semibold'>{displayName}</span>
                    {subText && (
                      <span className='truncate text-xs text-muted-foreground font-mono'>
                        {subText}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='/dashboard/profile'>
                    <User className='size-4' />
                    پروفایل
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href='/dashboard/support'>
                    <Settings className='size-4' />
                    پشتیبانی
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setOpen(true)}
              >
                <LogOut />
                خروج از حساب
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
