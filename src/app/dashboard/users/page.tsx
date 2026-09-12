'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Filter,
  Shield,
  User as UserIcon,
  ShoppingBag,
  ExternalLink,
  Calendar,
  Phone,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface AdminUserItem {
  id: string
  phone: string | null
  name: string | null
  role: 'ADMIN' | 'USER'
  telegramId?: string | null
  telegramUsername?: string | null
  createdAt: string
  totalOrders: number
  totalSpent: number
}

interface UserDetailModalData {
  id: string
  phone: string | null
  name: string | null
  role: string
  telegramUsername: string | null
  createdAt: string
  totalSpent: number
  orders: {
    id: string
    amount: number
    status: string
    createdAt: string
    plan: {
      name: string
      product: { name: string }
    }
    payment: {
      status: string
      refId: string | null
    } | null
    activationLink: {
      url: string
      status: string
    } | null
  }[]
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<UserDetailModalData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter !== 'ALL') params.set('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users || [])
      } else {
        toast.error(data.error || 'خطا در دریافت لیست کاربران.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleOpenUserDetail = async (userId: string) => {
    setSelectedUserId(userId)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()
      if (data.success) {
        setUserDetail(data.user)
      } else {
        toast.error(data.error || 'خطا در بارگذاری جزئیات کاربر.')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'ADMIN' | 'USER') => {
    setUpdatingRole(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'نقش کاربر به‌روزرسانی شد.')
        fetchUsers()
        if (userDetail && userDetail.id === userId) {
          setUserDetail({ ...userDetail, role: newRole })
        }
      } else {
        toast.error(data.error || 'خطا در تغییر نقش.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setUpdatingRole(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2 overflow-hidden'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <Users className='size-4 text-primary shrink-0' />
            <span className='truncate'>مدیریت کاربران</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchUsers}
            disabled={loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3'
            title='بروزرسانی'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6'>
        <div className='flex flex-col gap-5 sm:gap-6 w-full min-w-0'>
          {/* Filter & Search Bar */}
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-3.5 sm:p-4'>
              <form onSubmit={handleSearchSubmit} className='flex flex-col sm:flex-row items-center gap-3'>
                <div className='relative flex-1 w-full'>
                  <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                  <Input
                    placeholder='جستجو با شماره موبایل، نام یا نام کاربری تلگرام...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='ps-9 text-xs sm:text-sm h-10'
                  />
                </div>

                <div className='flex items-center gap-2 w-full sm:w-auto'>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className='w-full sm:w-36 h-10 text-xs'>
                      <SelectValue placeholder='فیلتر نقش' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه نقش‌ها</SelectItem>
                      <SelectItem value='ADMIN'>مدیران (Admin)</SelectItem>
                      <SelectItem value='USER'>کاربران عادی (User)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button type='submit' size='sm' className='h-10 px-4 text-xs font-semibold shrink-0'>
                    جستجو
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-sm sm:text-base font-bold'>لیست کاربران سیستم</CardTitle>
                  <CardDescription className='text-xs'>
                    مجموع {users.length.toLocaleString('fa-IR')} کاربر ثبت‌شده در پایگاه‌داده
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4 sm:p-6 pt-0 sm:pt-0'>
              {loading ? (
                <div className='flex items-center justify-center py-16'>
                  <Loader2 className='size-8 animate-spin text-primary' />
                </div>
              ) : users.length === 0 ? (
                <div className='py-12 text-center text-xs text-muted-foreground'>
                  هیچ کاربری با این مشخصات یافت نشد.
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[700px] text-xs text-start'>
                  <thead>
                    <tr className='border-b border-border/50 text-muted-foreground'>
                      <th className='py-3 text-start font-medium'>کاربر</th>
                      <th className='py-3 text-start font-medium'>شماره موبایل</th>
                      <th className='py-3 text-start font-medium'>نقش</th>
                      <th className='py-3 text-start font-medium'>تعداد سفارش</th>
                      <th className='py-3 text-start font-medium'>مجموع خرید</th>
                      <th className='py-3 text-start font-medium'>تاریخ عضویت</th>
                      <th className='py-3 text-end font-medium'>عملیات</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/40'>
                    {users.map((u) => (
                      <tr key={u.id} className='hover:bg-muted/30 transition-colors'>
                        <td className='py-3 font-semibold text-foreground'>
                          <div className='flex items-center gap-2'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold'>
                              {u.name?.trim() ? u.name.trim().charAt(0) : <UserIcon className='size-3.5' />}
                            </div>
                            <div>
                              <span>{u.name || 'بدون نام'}</span>
                              {u.telegramUsername && (
                                <span className='block text-[10px] text-muted-foreground font-mono'>
                                  @{u.telegramUsername}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className='py-3 font-sans tabular-nums text-muted-foreground'>
                          {u.phone || '—'}
                        </td>
                        <td className='py-3'>
                          {u.role === 'ADMIN' ? (
                            <Badge className='bg-primary/10 text-primary border-primary/25 text-[10px] gap-1 font-medium'>
                              <Shield className='size-2.5 text-primary' />
                              مدیر (Admin)
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='text-muted-foreground text-[10px]'>
                              کاربر (User)
                            </Badge>
                          )}
                        </td>
                        <td className='py-3 font-semibold'>
                          {u.totalOrders.toLocaleString('fa-IR')}
                        </td>
                        <td className='py-3 font-bold text-foreground'>
                          {u.totalSpent > 0 ? formatPrice(u.totalSpent) : '۰'}
                        </td>
                        <td className='py-3 text-muted-foreground text-[11px]'>
                          {formatDate(u.createdAt)}
                        </td>
                        <td className='py-3 text-end'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleOpenUserDetail(u.id)}
                            className='h-7 px-2.5 text-[11px] gap-1'
                          >
                            <Eye className='size-3' />
                            <span>جزئیات</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </Main>

      {/* User Detail Dialog */}
      <Dialog
        open={Boolean(selectedUserId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null)
            setUserDetail(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-base sm:text-lg font-bold flex items-center gap-2'>
              <UserIcon className='size-5 text-primary' />
              <span>پروفایل و تاریخچه سفارش‌های کاربر</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              بررسی کامل فعالیت‌ها و سفارش‌های ثبت‌شده کاربر
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !userDetail ? (
            <div className='flex items-center justify-center py-16'>
              <Loader2 className='size-8 animate-spin text-primary' />
            </div>
          ) : (
            <div className='space-y-6 pt-2'>
              {/* Profile Summary Card */}
              <div className='rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div>
                    <h3 className='text-base font-bold text-foreground'>
                      {userDetail.name || 'کاربر بدون نام'}
                    </h3>
                    <p className='text-xs text-muted-foreground font-sans tabular-nums mt-0.5'>
                      {userDetail.phone || 'ورود از طریق تلگرام'}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-muted-foreground'>نقش:</span>
                    <Select
                      value={userDetail.role}
                      onValueChange={(val: 'ADMIN' | 'USER') => handleChangeRole(userDetail.id, val)}
                      disabled={updatingRole}
                    >
                      <SelectTrigger className='h-8 w-28 text-xs font-semibold'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='USER'>User</SelectItem>
                        <SelectItem value='ADMIN'>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/40 text-xs'>
                  <div>
                    <span className='text-muted-foreground block text-[10px]'>کل خرید:</span>
                    <span className='font-bold text-foreground'>{formatPrice(userDetail.totalSpent)}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[10px]'>تعداد سفارش‌ها:</span>
                    <span className='font-bold text-foreground'>{userDetail.orders.length.toLocaleString('fa-IR')}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[10px]'>عضویت:</span>
                    <span className='font-bold text-foreground'>{formatDate(userDetail.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* User Orders Section */}
              <div>
                <h4 className='text-sm font-bold text-foreground mb-3 flex items-center gap-1.5'>
                  <ShoppingBag className='size-4 text-primary' />
                  <span>سفارش‌ها و خریدهای این کاربر</span>
                </h4>

                {userDetail.orders.length === 0 ? (
                  <div className='rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground'>
                    این کاربر هنوز هیچ سفارشی ثبت نکرده است.
                  </div>
                ) : (
                  <div className='space-y-2.5'>
                    {userDetail.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className='p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/20 transition-colors text-xs space-y-2'
                      >
                        <div className='flex items-center justify-between'>
                          <span className='font-bold text-foreground'>
                            {ord.plan?.product?.name} ({ord.plan?.name})
                          </span>
                          <span className='font-sans font-semibold text-primary tabular-nums'>
                            {formatPrice(ord.amount)}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                          <span className='font-sans'>شناسه: {ord.id}</span>
                          <span>{formatDate(ord.createdAt)}</span>
                        </div>
                        <div className='flex items-center justify-between pt-1 border-t border-border/40 text-[11px]'>
                          <div className='flex items-center gap-1.5'>
                            <span>وضعیت سفارش:</span>
                            <Badge variant='outline' className='text-[10px]'>
                              {ord.status}
                            </Badge>
                          </div>
                          {ord.payment?.refId && (
                            <span className='font-sans text-muted-foreground'>
                              کد پیگیری: {ord.payment.refId}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
