import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'messages.json')
const PASS = process.env.ADMIN_PASSWORD || 'thurga2001'

function readMessages() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeMessages(data: unknown) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

/* GET — fetch all messages (password required) */
export async function GET(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get('pwd')
  if (pwd !== PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(readMessages())
}

/* PATCH — mark a message as read */
export async function PATCH(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get('pwd')
  if (pwd !== PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const all = readMessages()
  const msg = all.find((m: { id: number }) => m.id === id)
  if (msg) msg.read = true
  writeMessages(all)
  return NextResponse.json({ ok: true })
}

/* DELETE — delete a message */
export async function DELETE(req: NextRequest) {
  const pwd = req.nextUrl.searchParams.get('pwd')
  if (pwd !== PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const all = readMessages().filter((m: { id: number }) => m.id !== id)
  writeMessages(all)
  return NextResponse.json({ ok: true })
}
