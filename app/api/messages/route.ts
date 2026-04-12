import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

const PASS = process.env.ADMIN_PASSWORD || 'thurga2001'

type Message = {
  id: number
  name: string
  email: string
  subject: string
  message: string
  date: string
  read: boolean
}

async function readMessages(): Promise<Message[]> {
  const raw = await redis.get('messages')
  return raw ? JSON.parse(raw) : []
}

/* GET — fetch all messages (password required) */
export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get('pwd')
  if (pwd !== PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await readMessages())
}

/* PATCH — mark a message as read */
export async function PATCH(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get('pwd')
  if (pwd !== PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const all = await readMessages()
  const msg = all.find(m => m.id === id)
  if (msg) msg.read = true
  await redis.set('messages', JSON.stringify(all))
  return NextResponse.json({ ok: true })
}

/* DELETE — delete a message */
export async function DELETE(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get('pwd')
  if (pwd !== PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const all = (await readMessages()).filter(m => m.id !== id)
  await redis.set('messages', JSON.stringify(all))
  return NextResponse.json({ ok: true })
}
