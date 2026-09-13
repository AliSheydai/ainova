import {
  CreditCard,
  HeadphonesIcon,
  Home,
  Link as LinkIcon,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Tag,
  Archive,
  Bell,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'مدیر سیستم',
    email: '',
    avatar: '',
  },
  teams: [
    {
      name: 'آریوچت',
      logo: () => null,
      plan: 'پنل مدیریت',
    },
  ],
  navGroups: [
    {
      title: 'منوی مدیریت',
      items: [
        {
          title: 'داشبورد',
          url: '/dashboard',
          icon: Home,
        },
        {
          title: 'کاربران',
          url: '/dashboard/users',
          icon: Users,
        },
        {
          title: 'سفارش‌ها',
          url: '/dashboard/orders',
          icon: Package,
        },
        {
          title: 'پرداخت‌ها',
          url: '/dashboard/payments',
          icon: CreditCard,
        },
        {
          title: 'لینک‌های فعال‌سازی',
          url: '/dashboard/activation-links',
          icon: LinkIcon,
        },
        {
          title: 'اکانت‌های آماده',
          url: '/dashboard/ready-accounts',
          icon: Archive,
        },
        {
          title: 'محصولات و پلن‌ها',
          url: '/dashboard/products',
          icon: ShoppingBag,
        },
        {
          title: 'کدهای تخفیف',
          url: '/dashboard/coupons',
          icon: Tag,
        },
        {
          title: 'اعلانات و پیام‌ها',
          url: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: 'پشتیبانی',
          url: '/dashboard/support',
          icon: HeadphonesIcon,
        },
        {
          title: 'تنظیمات',
          url: '/dashboard/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
