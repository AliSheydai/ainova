import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const authority = searchParams.get('authority')
  const amount = searchParams.get('amount')

  const redirectUrl = new URL('/checkout/mock-bank', req.url)
  if (authority) redirectUrl.searchParams.set('authority', authority)
  if (amount) redirectUrl.searchParams.set('amount', amount)

  return NextResponse.redirect(redirectUrl)
}
