'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Mail, Trash2, RefreshCw, Reply, Sun, Moon,
  CheckCircle2, ChevronLeft,
} from 'lucide-react'

type Message = {
  id: number
  name: string
  email: string
  subject: string
  message: string
  date: string
  read: boolean
}

/* ── small avatar initials bubble ── */
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-violet-500/20">
      {initials}
    </div>
  )
}

export default function AdminPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [pwd, setPwd]           = useState('')
  const [authed, setAuthed]     = useState(false)
  const [authError, setError]   = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading]   = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/messages?pwd=${encodeURIComponent(pwd)}`)
    if (res.ok) {
      setMessages(await res.json())
      setAuthed(true)
      setError('')
    } else {
      setError('Incorrect password. Try again.')
    }
    setLoading(false)
  }

  async function refresh() {
    setLoading(true)
    const res = await fetch(`/api/messages?pwd=${encodeURIComponent(pwd)}`)
    if (res.ok) setMessages(await res.json())
    setLoading(false)
  }

  async function markRead(id: number) {
    await fetch(`/api/messages?pwd=${encodeURIComponent(pwd)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
    setSelected(prev => (prev?.id === id ? { ...prev, read: true } : prev))
  }

  async function deleteMsg(id: number) {
    await fetch(`/api/messages?pwd=${encodeURIComponent(pwd)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMessages(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) { setSelected(null); setShowDetail(false) }
  }

  function openMessage(msg: Message) {
    setSelected(msg)
    setShowDetail(true)
    if (!msg.read) markRead(msg.id)
  }

  const unread = messages.filter(m => !m.read).length

  /* ══════════════════════════════════════════
      LOGIN
  ══════════════════════════════════════════ */
  if (!authed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden">
        {/* Orbs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        </div>

        {/* Theme toggle */}
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="absolute top-5 right-5 p-2 rounded-xl border border-border hover:border-violet-500/50 bg-background/60 backdrop-blur-sm transition-all hover:scale-110">
          {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-violet-600" />}
        </button>

        <div className="w-full max-w-sm">
          {/* Logo / avatar */}
          <div className="text-center mb-10">
            <div className="relative inline-flex mb-5">
              <img
                src="/Thurga Rajinathan.png"
                alt="Thurga Rajinathan"
                className="h-20 w-auto object-contain drop-shadow-xl"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Admin{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">Inbox</span>
            </h1>
            <p className="text-foreground/45 text-sm mt-1 font-light">Thurga Rajinathan · Portfolio</p>
          </div>

          <form onSubmit={login} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                className="w-full bg-card/60 backdrop-blur-sm border border-border/60 focus:border-violet-500/70 rounded-2xl px-5 py-3.5 text-foreground placeholder:text-foreground/30 outline-none transition-all text-sm shadow-sm"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2 px-3">
                {authError}
              </p>
            )}

            <button type="submit" disabled={loading || !pwd}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-3.5 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-violet-500/30">
              {loading ? 'Verifying…' : 'Enter Inbox'}
            </button>
          </form>

          <p className="text-center text-foreground/25 text-xs mt-6">Private access only</p>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════
      INBOX
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      {/* ── Header ── */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-2xl px-5 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src="/Thurga Rajinathan.png"
            alt="Thurga Rajinathan"
            className="h-8 w-auto object-contain"
          />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Portfolio Inbox</span>
            {unread > 0 && (
              <span className="bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unread} new
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading}
            className="p-2 rounded-xl border border-border/60 hover:border-violet-500/50 bg-background/60 text-foreground/50 hover:text-violet-500 transition-all hover:scale-110 disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-border/60 hover:border-violet-500/50 bg-background/60 transition-all hover:scale-110">
            {isDark ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-violet-600" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Message list ── */}
        <aside className={`${showDetail ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-border/50 overflow-y-auto flex-shrink-0`}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-foreground/30 py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-card/60 border border-border/50 flex items-center justify-center">
                <Mail size={22} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-foreground/20">Messages from your contact form will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {messages.map(msg => (
                <button key={msg.id} onClick={() => openMessage(msg)}
                  className={`w-full text-left px-4 py-4 transition-all hover:bg-violet-500/5 group relative
                    ${selected?.id === msg.id ? 'bg-violet-500/8 border-l-2 border-l-violet-500' : 'border-l-2 border-l-transparent'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={msg.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${msg.read ? 'text-foreground/60 font-normal' : 'text-foreground font-semibold'}`}>
                          {msg.name}
                        </span>
                        {!msg.read && <span className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex-shrink-0 ml-2" />}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${msg.read ? 'text-foreground/35' : 'text-foreground/60'}`}>
                        {msg.subject || '(no subject)'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/30 truncate pl-12">{msg.message}</p>
                  <p className="text-[10px] text-foreground/20 mt-1.5 pl-12 font-mono">
                    {new Date(msg.date).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── Message detail ── */}
        <main className={`${showDetail ? 'flex' : 'hidden sm:flex'} flex-1 flex-col overflow-y-auto`}>
          {selected ? (
            <div className="p-6 sm:p-10 max-w-2xl w-full mx-auto">
              {/* Back on mobile */}
              <button onClick={() => setShowDetail(false)}
                className="sm:hidden flex items-center gap-1.5 text-foreground/50 hover:text-foreground text-sm mb-6 transition-colors">
                <ChevronLeft size={16} /> Back
              </button>

              {/* Sender card */}
              <div className="flex items-start gap-4 mb-6">
                <Avatar name={selected.name} />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg text-foreground leading-tight mb-0.5">
                    {selected.subject || '(no subject)'}
                  </h2>
                  <p className="text-sm text-foreground/50">{selected.name} · <span className="text-violet-500">{selected.email}</span></p>
                  <p className="text-xs text-foreground/30 font-mono mt-1">{new Date(selected.date).toLocaleString()}</p>
                </div>
                {selected.read && (
                  <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                    <CheckCircle2 size={13} /> Read
                  </span>
                )}
              </div>

              {/* Message body */}
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6 shadow-sm">
                <p className="text-foreground/75 leading-relaxed whitespace-pre-wrap text-sm">{selected.message}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Your message')}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/25">
                  <Reply size={15} /> Reply via Email
                </a>
                <button onClick={() => deleteMsg(selected.id)}
                  className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/8 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-foreground/25 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-card/60 border border-border/50 flex items-center justify-center backdrop-blur-sm">
                <Mail size={26} className="opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Select a message</p>
                <p className="text-xs text-foreground/20 mt-1">Choose from the list to read</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
