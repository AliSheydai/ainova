import {
  BookOpen,
  HeadphonesIcon,
  Home,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'کاربر',
    email: '',
    avatar: '',
  },
  teams: [
    {
      name: 'Google AI Pro',
      logo: () => null, // Will use custom brand
      plan: 'پنل کاربری',
    },
  ],
  navGroups: [
    {
      title: 'منو اصلی',
      items: [
        {
          title: 'داشبورد',
          url: '/dashboard',
          icon: Home,
        },
        {
          title: 'خرید Google AI Pro',
          url: '/dashboard/buy',
          icon: ShoppingCart,
        },
        {
          title: 'سفارش‌های من',
          url: '/dashboard/orders',
          icon: Package,
        },
        {
          title: 'راهنمای فعال‌سازی',
          url: '/dashboard/activation-guide',
          icon: BookOpen,
        },
        {
          title: 'پشتیبانی',
          url: '/dashboard/support',
          icon: HeadphonesIcon,
        },
      ],
    },
  ],
}
