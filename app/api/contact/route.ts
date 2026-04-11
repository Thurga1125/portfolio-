import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'messages.json')

function readMessages() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

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

  const all = readMessages()
  all.unshift(entry)
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2))

  return NextResponse.json({ ok: true })
}
