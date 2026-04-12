import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const entry = {
    id: Date.now(),
    name,
    email,
    subject: subject || '',
    message,
    date: new Date().toISOString(),
    read: false,
  }

  const raw = await redis.get('messages')
  const existing = raw ? JSON.parse(raw) : []
  existing.unshift(entry)
  await redis.set('messages', JSON.stringify(existing))

  return NextResponse.json({ ok: true })
}
