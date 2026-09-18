import { notFound } from 'next/navigation'
import JibitGatewayClient from './jibit-gateway-client'

export const metadata = {
  title: 'درگاه پرداخت تستی جیبیت | Jibit PPG Sandbox',
  description: 'محیط آزمایشی پرداخت امن شاپرک از طریق درگاه پرداخت جیبیت',
  robots: {
    index: false,
    follow: false,
  },
}

export default function JibitGatewayPage() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_MOCK_PAYMENT !== 'true' &&
    process.env.JIBIT_SANDBOX !== 'true'
  ) {
    notFound()
  }

  return <JibitGatewayClient />
}
