import { notFound } from 'next/navigation'
import MockBankClient from './mock-bank-client'

export const metadata = {
  title: 'درگاه پرداخت تستی',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MockBankPage() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_MOCK_PAYMENT !== 'true'
  ) {
    notFound()
  }

  return <MockBankClient />
}
