import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_MOCK_PAYMENT !== 'true'
  ) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const authority = searchParams.get('authority')
  const amount = searchParams.get('amount')

  const redirectUrl = new URL('/checkout/mock-bank', req.url)
  if (authority) redirectUrl.searchParams.set('authority', authority)
  if (amount) redirectUrl.searchParams.set('amount', amount)

  return NextResponse.redirect(redirectUrl)
}
