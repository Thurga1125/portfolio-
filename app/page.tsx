'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type MouseEvent as RMouseEvent,
} from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  GraduationCap,
  Briefcase,
  ArrowUpRight,
  Send,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   3-D rotating sphere — pure Canvas, no extra deps
   ───────────────────────────────────────────────────────────────────────────── */
function AnimatedSphere({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const setSize = () => {
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
    }
    setSize()
    window.addEventListener('resize', setSize)

    const N = 130
    const pts = Array.from({ length: N }, (_, i) => {
      const phi   = Math.acos(1 - (2 * i + 1) / N)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      return {
        ox: Math.sin(phi) * Math.cos(theta),
        oy: Math.sin(phi) * Math.sin(theta),
        oz: Math.cos(phi),
      }
    })

    let mx = 0, my = 0
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 0.6
      my = (e.clientY / window.innerHeight - 0.5) * 0.4
    }
    window.addEventListener('mousemove', onMouse)

    let angle = 0, raf: number

    const render = () => {
      const W = canvas.width / dpr, H = canvas.height / dpr
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save(); ctx.scale(dpr, dpr)

      angle += 0.0035
      const cosA  = Math.cos(angle + mx), sinA  = Math.sin(angle + mx)
      const tiltX = 0.35 + my
      const cosTX = Math.cos(tiltX),      sinTX = Math.sin(tiltX)
      const R = Math.min(W, H) * 0.38, cx = W / 2, cy = H / 2

      const projected = pts.map(p => {
        const rx  = p.ox * cosA  - p.oz * sinA
        const rz  = p.ox * sinA  + p.oz * cosA
        const ry2 = p.oy * cosTX - rz  * sinTX
        const rz2 = p.oy * sinTX + rz  * cosTX
        const fov = 3.8, sc = fov / (fov + rz2)
        return { sx: cx + rx * R * sc, sy: cy + ry2 * R * sc, z: rz2, scale: sc, oy: p.oy }
      })

      const [r1, g1, b1] = isDark ? [139, 92, 246] : [109, 40, 217]
      const [r2, g2, b2] = isDark ? [236, 72, 153] : [190, 24, 93]
      const CONN = 0.55

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].ox - pts[j].ox, dy = pts[i].oy - pts[j].oy, dz = pts[i].oz - pts[j].oz
          const d3 = Math.sqrt(dx*dx + dy*dy + dz*dz)
          if (d3 < CONN) {
            const zF = ((projected[i].z + projected[j].z) / 2 + 1) / 2
            const a  = (1 - d3 / CONN) * 0.38 * (0.2 + zF * 0.8)
            ctx.beginPath()
            ctx.strokeStyle = `rgba(${r1},${g1},${b1},${a})`
            ctx.lineWidth = 0.7
            ctx.moveTo(projected[i].sx, projected[i].sy)
            ctx.lineTo(projected[j].sx, projected[j].sy)
            ctx.stroke()
          }
        }
      }

      projected.forEach((p, i) => {
        const brightness = (p.z + 1) / 2
        const alpha = 0.35 + brightness * 0.65
        const size  = (0.7 + brightness * 2.2) * p.scale
        const t  = (pts[i].oy + 1) / 2
        const dr = r1 + (r2 - r1) * t, dg = g1 + (g2 - g1) * t, db = b1 + (b2 - b1) * t
        if (brightness > 0.7) {
          ctx.beginPath()
          const grd = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, size * 4)
          grd.addColorStop(0, `rgba(${dr},${dg},${db},${alpha * 0.25})`)
          grd.addColorStop(1, `rgba(${dr},${dg},${db},0)`)
          ctx.fillStyle = grd; ctx.arc(p.sx, p.sy, size * 4, 0, Math.PI * 2); ctx.fill()
        }
        ctx.beginPath()
        ctx.fillStyle = `rgba(${dr},${dg},${db},${alpha})`
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2); ctx.fill()
      })

      ctx.restore(); raf = requestAnimationFrame(render)
    }

    render()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', setSize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [isDark])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />
}

/* ─── Typewriter ─────────────────────────────────────────────────────────────── */
const ROLES = ['Full Stack Developer', 'UI / UX Enthusiast', 'Angular & React Dev', 'Spring Boot Engineer', 'Open Source Learner']

function TypingText() {
  const [idx, setIdx]           = useState(0)
  const [display, setDisplay]   = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = ROLES[idx]
    let t: ReturnType<typeof setTimeout>
    if (!deleting && display.length < current.length) {
      t = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), 75)
    } else if (!deleting && display.length === current.length) {
      t = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && display.length > 0) {
      t = setTimeout(() => setDisplay(display.slice(0, -1)), 38)
    } else {
      setDeleting(false); setIdx(v => (v + 1) % ROLES.length)
    }
    return () => clearTimeout(t)
  }, [display, deleting, idx])

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500">
      {display}<span className="animate-pulse text-violet-500">|</span>
    </span>
  )
}

/* ─── 3-D tilt card ──────────────────────────────────────────────────────────── */
function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = useCallback((e: RMouseEvent) => {
    const el = ref.current; if (!el) return
    const r  = el.getBoundingClientRect()
    const rx = ((e.clientY - r.top)  / r.height - 0.5) * 14
    const ry = ((e.clientX - r.left) / r.width  - 0.5) * -14
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.025)`
  }, [])
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
  }, [])
  return (
    <div ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: 'transform 0.18s ease', transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  )
}

/* ─── 3-D Profile Photo ─────────────────────────────────────────────────────── */
function ProfilePhoto3D() {
  return (
    <div className="profile-photo-3d">
      {/* Ambient glow */}
      <div className="profile-glow-base" />

      {/* Tilted orbit rings (3-D depth illusion) */}
      <div className="profile-orbit profile-orbit-3" />
      <div className="profile-orbit profile-orbit-2" />
      <div className="profile-orbit profile-orbit-1" />

      {/* Spinning conic-gradient border + photo */}
      <div className="profile-spin-ring">
        <div className="profile-inner">
          <img src="/thurga-photo.jpeg" alt="Thurga Rajinathan" className="profile-img" />
        </div>
      </div>

      {/* Floating particles */}
      <span className="profile-particle profile-particle-1" />
      <span className="profile-particle profile-particle-2" />
      <span className="profile-particle profile-particle-3" />

    
    </div>
  )
}


/* ─── Scroll reveal ──────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.classList.add('reveal')
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.style.transitionDelay = `${delay}ms`; el.classList.add('visible'); obs.unobserve(el) } },
      { threshold: 0.12 },
    )
    obs.observe(el); return () => obs.disconnect()
  }, [delay])
  return <div ref={ref}>{children}</div>
}

/* ─── Section header ─────────────────────────────────────────────────────────── */
function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center mb-16">
      <p className="text-xs font-semibold text-violet-500 uppercase tracking-[0.25em] mb-3">{sub}</p>
      <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground">{title}</h2>
      <div className="mt-5 w-16 h-1 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full mx-auto" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Data
   ───────────────────────────────────────────────────────────────────────────── */
type Project = {
  title: string; description: string; tech: string[]; link: string
  features: string[]; gradient: string; glow: string
}

const FEATURED_PROJECTS: Project[] = [
  {
    title: 'TrafficPay LK — Digital Traffic Fine System',
    description: 'Digital traffic fine payment and monitoring system built for the Sri Lanka Police Department, streamlining fine issuance, payment tracking, and officer management.',
    tech: ['React', 'Spring Boot', 'MySQL', 'JWT'],
    link: 'https://github.com/Thurga1125/trafficpay-lk',
    features: ['Fine management', 'Payment gateway', 'Officer portal'],
    gradient: 'from-red-500/15 to-orange-600/15',
    glow: 'hover:shadow-red-500/20',
  },
  {
    title: 'Movie Ticket Booking with TDD/BDD & CI/CD',
    description: 'Cinema ticket booking platform built with a test-driven approach — full TDD/BDD test suite and automated CI/CD pipeline for continuous delivery.',
    tech: ['React', 'Spring Boot', 'MySQL', 'JUnit', 'CI/CD'],
    link: 'https://github.com/Thurga1125/Movie-ticket-Booking-with-testing',
    features: ['TDD/BDD tests', 'CI/CD pipeline', 'Seat selection'],
    gradient: 'from-blue-500/15 to-indigo-600/15',
    glow: 'hover:shadow-blue-500/20',
  },
  {
    title: 'FeedPulse — AI Feedback Platform',
    description: 'Intelligent feedback collection with Gemini AI for automatic categorisation, sentiment analysis, and prioritisation.',
    tech: ['Next.js 14', 'Express', 'MongoDB', 'Gemini AI', 'Redis'],
    link: 'https://github.com/Thurga1125/FeedPulse-AI-Powered-Product-Feedback-Platform',
    features: ['AI analysis', 'Admin dashboard', 'Real-time filtering'],
    gradient: 'from-pink-500/15 to-rose-600/15',
    glow: 'hover:shadow-pink-500/20',
  },
]

const MORE_PROJECTS: Project[] = [
  {
    title: 'Stock Price Prediction (LSTM)',
    description: 'AI mini project using Long Short-Term Memory neural networks to predict stock prices from historical data with time-series analysis.',
    tech: ['Python', 'TensorFlow', 'LSTM', 'Pandas', 'Matplotlib'],
    link: 'https://github.com/Thurga1125/Stock-Price-Prediction',
    features: ['LSTM model', 'Time-series analysis', 'Price forecasting'],
    gradient: 'from-cyan-500/15 to-blue-600/15',
    glow: 'hover:shadow-cyan-500/20',
  },
  {
    title: 'zen-greenpulse — Wellness Platform',
    description: 'Wellness web platform built for the BotCalm Code Night competition, combining mindfulness and fitness tools for busy people.',
    tech: ['React', 'Node.js', 'MongoDB'],
    link: 'https://github.com/Thurga1125/zen-greenpulse',
    features: ['Mindfulness tools', 'Fitness tracker', 'Wellness dashboard'],
    gradient: 'from-green-500/15 to-teal-600/15',
    glow: 'hover:shadow-green-500/20',
  },
  {
    title: 'Barista Cafe Management System',
    description: 'Full-stack cafe management system with real-time order tracking, admin dashboard, and complete menu management.',
    tech: ['Angular 17', 'Spring Boot', 'MongoDB', 'JWT'],
    link: 'https://github.com/Thurga1125/Cafe-Management-System--Angular',
    features: ['Customer ordering', 'Admin dashboard', 'Real-time status'],
    gradient: 'from-violet-500/15 to-purple-600/15',
    glow: 'hover:shadow-violet-500/20',
  },
  {
    title: 'Doctor Channeling System - DevOps',
    description: 'Healthcare appointment booking platform enabling patients to channel doctors, manage appointments, and track consultation history.',
    tech: ['React', 'Node.js', 'MongoDB', 'Docker'],
    link: 'https://github.com/Thurga1125/Docter-channeling-_-Devops',
    features: ['Appointment booking', 'Doctor profiles', 'Patient records'],
    gradient: 'from-emerald-500/15 to-teal-600/15',
    glow: 'hover:shadow-emerald-500/20',
  },
  {
    title: 'Customer Churn Prediction System',
    description: 'Machine learning project to predict customer churn using data analysis, feature engineering, and classification models for business insights.',
    tech: ['Python', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter'],
    link: 'https://github.com/Thurga1125/Customer-Churn-Prediction-ML-project',
    features: ['Churn prediction model', 'Data preprocessing', 'Model evaluation'],
    gradient: 'from-blue-500/15 to-cyan-600/15',
    glow: 'hover:shadow-blue-500/20',
  },
  {
    title: 'OptiGrade — Answer Sheet Checker',
    description: 'Computer vision-based system for automated MCQ answer sheet evaluation using image processing and intelligent grading techniques.',
    tech: ['Python', 'OpenCV', 'Machine Learning', 'NumPy'],
    link: 'https://github.com/Thurga1125/OptiGrade-Computer-Vision-Based-Answer-Sheet-Checker',
    features: ['Answer sheet detection', 'Automated grading', 'Image processing'],
    gradient: 'from-green-500/15 to-emerald-600/15',
    glow: 'hover:shadow-green-500/20',
  },
  {
    title: 'Task Manager Full-Stack App',
    description: 'Full-stack task management application with user authentication, task tracking, and CRUD operations for productivity management.',
    tech: ['Angular', 'Spring Boot', 'MySQL', 'JWT'],
    link: 'https://github.com/Thurga1125/Task-Manager-Fullstack',
    features: ['Task CRUD operations', 'User authentication', 'Dashboard view'],
    gradient: 'from-orange-500/15 to-red-600/15',
    glow: 'hover:shadow-orange-500/20',
  },
  {
    title: 'BOC Mobile Banking App',
    description: 'Modern, secure mobile banking app built with React, featuring BOC\'s golden branding, fast 24/7 access to banking services and account management.',
    tech: ['React', 'Firebase', 'Mobile UI'],
    link: 'https://github.com/Thurga1125/Mobile-application--BOC-bank-app',
    features: ['Account management', 'Transaction interface', 'Mobile UI design'],
    gradient: 'from-yellow-500/15 to-amber-600/15',
    glow: 'hover:shadow-yellow-500/20',
  },
  {
    title: 'Bibliometric Data Collection',
    description: 'Group project focused on collecting and analysing academic publication data with a systematic, collaborative approach.',
    tech: ['Data Collection', 'Analysis', 'Collaboration'],
    link: 'https://github.com/Thurga1125/Software-Group-Project-Bibliometric-Data-Collection',
    features: ['Data aggregation', 'Analysis tools', 'Reporting'],
    gradient: 'from-orange-500/15 to-amber-600/15',
    glow: 'hover:shadow-orange-500/20',
  },
  {
    title: 'ClassKeeper — Student Attendance System',
    description: 'Comprehensive student attendance management system for educational institutions with both a PHP web interface and a C# WPF desktop application.',
    tech: ['PHP', 'C#', 'WPF', 'MySQL'],
    link: 'https://github.com/Thurga1125/ClassKeeper-',
    features: ['Attendance tracking', 'Student management', 'Web & desktop'],
    gradient: 'from-teal-500/15 to-cyan-600/15',
    glow: 'hover:shadow-teal-500/20',
  },
  {
    title: 'Coach-Student Management System',
    description: 'Spring Boot REST API backend for managing coach-student relationships, session scheduling, and performance tracking in a structured coaching environment.',
    tech: ['Java', 'Spring Boot', 'MySQL', 'REST API'],
    link: 'https://github.com/Thurga1125/Coach-Student-Springboot',
    features: ['Coach management', 'Student tracking', 'REST API'],
    gradient: 'from-amber-500/15 to-orange-600/15',
    glow: 'hover:shadow-amber-500/20',
  },
  {
    title: 'MindBodyBalance — Wellness Platform',
    description: 'A wellness platform combining mindfulness and fitness tools for busy people, helping cultivate mental clarity and physical vitality without overwhelm.',
    tech: ['TypeScript', 'React', 'Wellness UI'],
    link: 'https://github.com/Thurga1125/MindBodyBalance',
    features: ['Mindfulness tools', 'Fitness tracker', 'Beginner-friendly'],
    gradient: 'from-purple-500/15 to-indigo-600/15',
    glow: 'hover:shadow-purple-500/20',
  },
  {
    title: 'TrashCollection — Waste Management App',
    description: 'Full-stack web application for waste collection management, enabling efficient scheduling and real-time tracking of waste collection services.',
    tech: ['JavaScript', 'Node.js', 'HTML/CSS', 'MongoDB'],
    link: 'https://github.com/Thurga1125/Trashcollection-',
    features: ['Collection scheduling', 'Route management', 'User portal'],
    gradient: 'from-lime-500/15 to-green-600/15',
    glow: 'hover:shadow-lime-500/20',
  },
  {
    title: 'Automated Car Parking System',
    description: 'Hardware design project implementing a fully automated car parking system with a slot counter using Verilog HDL, synthesised and tested on FPGA.',
    tech: ['Verilog', 'FPGA', 'Digital Logic', 'HDL'],
    link: 'https://github.com/Thurga1125/FULLY-AUTOMATED-CAR-PARKING-SYSTEM-WITH-SLOT-COUNTER',
    features: ['Slot counter', 'Entry/exit automation', 'FPGA implementation'],
    gradient: 'from-slate-500/15 to-gray-600/15',
    glow: 'hover:shadow-slate-500/20',
  },
  {
    title: 'Task Management System — Tech Assessment',
    description: 'Task management system built as a technical assessment, featuring full CRUD operations, status tracking, filtering, and a clean responsive UI.',
    tech: ['TypeScript', 'React', 'REST API', 'Tailwind CSS'],
    link: 'https://github.com/Thurga1125/Technical-Assessment-Task-Management-System',
    features: ['Task CRUD', 'Status filtering', 'Clean UI'],
    gradient: 'from-rose-500/15 to-pink-600/15',
    glow: 'hover:shadow-rose-500/20',
  },
]

const SKILLS = [
  { cat: 'Frontend',    icon: '', items: ['React', 'Angular 17', 'Next.js', 'TypeScript', 'Tailwind CSS', 'ShadCN UI', 'Flutter / Dart'], grad: 'from-violet-500 to-purple-600' },
  { cat: 'Backend',     icon: '', items: ['Spring Boot', 'Node.js', 'Express', 'Java', 'C#', 'PHP', 'Python'],          grad: 'from-blue-500 to-cyan-600' },
  { cat: 'Database',    icon: '', items: ['MongoDB', 'MySQL', 'SQLite', 'Neo4j', 'Redis'],                              grad: 'from-emerald-500 to-green-600' },
  { cat: 'AI / ML',     icon: '', items: ['TensorFlow', 'Scikit-learn', 'OpenCV', 'LSTM', 'Pandas', 'NumPy', 'Gemini AI'], grad: 'from-pink-500 to-rose-600' },
  { cat: 'Hardware',    icon: '', items: ['Verilog', 'FPGA', 'Digital Logic Design'],                                   grad: 'from-slate-500 to-gray-600' },
  { cat: 'Tools',       icon: '', items: ['Git', 'Docker', 'Figma', 'CapCut', 'Firebase', 'Postman', 'IntelliJ'],       grad: 'from-orange-500 to-amber-600' },
  { cat: 'Soft Skills', icon: '', items: ['UI/UX Design', 'Video Editing', 'Leadership', 'Problem Solving'],            grad: 'from-teal-500 to-cyan-600' },
]

const EXPERIENCE = [
  { role: 'Intern Software Engineer',  company: 'BotCalm Pvt Ltd',                        period: 'Jun 2026 – Present', description: 'Working as an intern software engineer, contributing to real-world product development and collaborating with an experienced engineering team.',  grad: 'from-emerald-500 to-teal-600' },
  { role: 'Full Stack Web Developer',  company: 'Freelance',                              period: 'Sep 2024 – Present', description: 'Building full-stack applications and gaining hands-on experience with modern web technologies.',                                                   grad: 'from-violet-500 to-purple-600' },
  { role: 'Program Lead',              company: 'IEEE Student Branch — Univ. of Ruhuna',  period: 'Mar 2025 – Present', description: 'Leading projects and coordinating technical initiatives for the IEEE community.',                                                               grad: 'from-blue-500 to-cyan-600' },
  { role: 'Secretariat Team Lead',     company: 'Xtreme 19.0',                            period: 'Aug 2025 – Present', description: 'Managing team operations and coordination for large-scale technical events.',                                                                   grad: 'from-pink-500 to-rose-600' },
  { role: 'Member',                    company: 'Eminence 5.0 — IEEE WIE',                period: 'Aug 2025 – Present', description: 'Active member of Women in Engineering society, promoting diversity in tech.',                                                                   grad: 'from-orange-500 to-amber-600' },
]

/* ─── Shared project card ────────────────────────────────────────────────────── */
function ProjectCard({ p }: { p: Project }) {
  return (
    <TiltCard className="h-full">
      <Card className={`overflow-hidden h-full flex flex-col bg-gradient-to-br ${p.gradient} border-border/50 hover:shadow-xl ${p.glow} transition-all duration-300 dark:bg-card/60 backdrop-blur-sm`}>
        <div className="p-6 flex flex-col h-full">
          <h3 className="text-base font-bold mb-2 text-foreground leading-snug">{p.title}</h3>
          <p className="text-foreground/55 text-sm mb-4 flex-grow leading-relaxed">{p.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.tech.map(t => <Badge key={t} className="bg-background/70 dark:bg-background/40 text-foreground/70 border-border/50 text-xs">{t}</Badge>)}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-5">
            {p.features.map(f => <span key={f} className="text-xs text-foreground/35">• {f}</span>)}
          </div>
          <a href={p.link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2 border-border/60 hover:border-violet-500/60 hover:bg-violet-500/10 hover:text-violet-500 transition-all text-sm">
              View on GitHub <ArrowUpRight size={14} />
            </Button>
          </a>
        </div>
      </Card>
    </TiltCard>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = ['home', 'about', 'projects', 'skills', 'experience', 'contact']

export default function Portfolio() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted]       = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [activeSection, setActive]  = useState('home')
  const [showMore, setShowMore]     = useState(false)
  const [form, setForm]             = useState({ name: '', email: '', subject: '', message: '' })
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const cb = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', cb, { passive: true })
    return () => window.removeEventListener('scroll', cb)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const obs: IntersectionObserver[] = []
    NAV_ITEMS.forEach(id => {
      const el = document.getElementById(id); if (!el) return
      const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(id) }, { rootMargin: '-35% 0px -65% 0px' })
      o.observe(el); obs.push(o)
    })
    return () => obs.forEach(o => o.disconnect())
  }, [mounted])

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(v => ({ ...v, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('failed')
      setFormStatus('sent')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setFormStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Floating background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      {/* ── NAVIGATION ─────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/75 backdrop-blur-2xl border-b border-border shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('home')} className="flex items-center">
            <img src="/Thurga Rajinathan.png" alt="Thurga Rajinathan" className="h-10 w-auto object-contain" />
          </button>

          <div className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map(item => (
              <button key={item} onClick={() => scrollTo(item)}
                className={`capitalize text-sm font-medium transition-all relative group ${activeSection === item ? 'text-foreground' : 'text-foreground/50 hover:text-foreground'}`}>
                {item}
                <span className={`absolute -bottom-0.5 left-0 h-[2px] bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-300 ${activeSection === item ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme"
                className="p-2 rounded-xl border border-border hover:border-violet-500/50 bg-background/60 backdrop-blur-sm transition-all hover:scale-110 active:scale-95">
                {isDark ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-violet-600" />}
              </button>
            )}
            <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu"
              className="md:hidden p-2 rounded-xl border border-border hover:border-violet-500/50 bg-background/60 backdrop-blur-sm transition-all">
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <button key={item} onClick={() => scrollTo(item)}
                  className={`block w-full text-left capitalize py-2.5 px-4 rounded-xl text-sm transition-colors ${activeSection === item ? 'bg-violet-500/15 text-violet-500 font-semibold' : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ═════════════════════════════════════════════════════════════ */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">{mounted && <AnimatedSphere isDark={isDark} />}</div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <img
                src="/thurga-photo.jpeg"
                alt="Thurga Rajinathan"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-violet-500/40 shadow-xl shadow-violet-500/20"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background" />
            </div>
          </div>

          <div className="mb-8">
            <span className="pulse-badge inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-500 border border-emerald-500/35 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Intern Software Engineer @ BotCalm Pvt Ltd
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold mb-5 leading-[1.05] tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-pink-400 to-purple-500">Thurga</span>
            <br /><span className="text-foreground">Rajinathan</span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground/50 mb-3 font-light tracking-wide">
            Computer Engineering Undergraduate · University of Ruhuna
          </p>

          <p className="text-xl sm:text-2xl font-semibold mb-9 min-h-[2rem]">
            {mounted && <TypingText />}
          </p>

          <p className="text-base text-foreground/45 mb-10 max-w-lg mx-auto leading-relaxed">
            Turning creative ideas into user-friendly digital experiences.
            Building full-stack apps with Angular, React, Spring Boot and more.
          </p>

          {/* ── Hero CTAs — no nested buttons ── */}
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="https://github.com/Thurga1125" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 border-0 shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95 text-white">
                <Github size={17} />GitHub
              </Button>
            </a>
            <a href="https://www.linkedin.com/in/thurgarajinathan25/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 border-violet-500/40 hover:bg-violet-500/10 hover:border-violet-500 transition-all hover:scale-105 active:scale-95">
                <Linkedin size={17} />LinkedIn
              </Button>
            </a>
            {/* Fixed: onClick on Button directly — no wrapping <button> */}
            <Button variant="outline" onClick={() => scrollTo('contact')}
              className="gap-2 border-pink-500/40 hover:bg-pink-500/10 hover:border-pink-500 transition-all hover:scale-105 active:scale-95">
              <Mail size={17} />Get in Touch
            </Button>
          </div>
        </div>

        <button onClick={() => scrollTo('about')} aria-label="Scroll down"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-foreground/25 hover:text-violet-500 transition-colors animate-bounce">
          <ChevronDown size={30} />
        </button>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ABOUT
      ═════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal><SectionHeader title="About Me" sub="Who I am" /></Reveal>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <Reveal delay={100}>
              <div className="space-y-5 text-foreground/65 leading-relaxed text-[1.05rem]">
                <p>I&apos;m a passionate Computer Engineering undergraduate at the <strong className="text-foreground">University of Ruhuna</strong>, Sri Lanka, with a deep love for software development,DevOps engineering,AI/ML engineering , and creative UI/UX designing.</p>
                <p>Over the past years I&apos;ve built experience through diverse full-stack projects, leadership roles within the <strong className="text-violet-500">IEEE Student Branch</strong>, and active participation in real world projects.</p>
                <p>Currently working as an <strong className="text-emerald-500">Intern Software Engineer at BotCalm Pvt Ltd</strong>, applying my skills in a real-world engineering environment while continuing to grow with <strong className="text-pink-500">Java</strong>, <strong className="text-pink-500">Angular</strong>, <strong className="text-pink-500">React</strong>, and Figma.</p>
              </div>
            </Reveal>
            <div className="space-y-4">
              <Reveal delay={150}>
                <TiltCard>
                  <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-600/10 border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-violet-500/15"><GraduationCap className="text-violet-500" size={22} /></div>
                      <h3 className="font-bold text-lg">Education</h3>
                    </div>
                    <p className="font-semibold text-foreground">Bsc.Eng. — Computer Engineering(R)</p>
                    <p className="text-foreground/55 mt-1">University of Ruhuna, Sri Lanka</p>
                    <p className="text-xs text-foreground/35 mt-2 font-mono">2023 — 2027</p>
                  </Card>
                </TiltCard>
              </Reveal>
              <Reveal delay={200}>
                <TiltCard>
                  <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-rose-600/10 border-pink-500/20 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-pink-500/15"><Briefcase className="text-pink-500" size={22} /></div>
                      <h3 className="font-bold text-lg">Current Roles</h3>
                    </div>
                    <ul className="space-y-1.5 text-foreground/60 text-sm">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />Intern Software Engineer — BotCalm Pvt Ltd</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />Program Lead — IEEE Student Branch</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />Secretariat Lead — Xtreme 19.0</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />Member — IEEE WIE &amp; SEDS</li>
                    </ul>
                  </Card>
                </TiltCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROJECTS
      ═════════════════════════════════════════════════════════════ */}
      <section id="projects" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal><SectionHeader title="Featured Projects" sub="Things I've built" /></Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_PROJECTS.map((p, i) => (
              <Reveal key={i} delay={i * 100}><ProjectCard p={p} /></Reveal>
            ))}
          </div>

          {/* Hidden extra projects */}
          {showMore && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {MORE_PROJECTS.map((p, i) => (
                <Reveal key={i} delay={i * 100}><ProjectCard p={p} /></Reveal>
              ))}
            </div>
          )}

          <Reveal>
            <div className="mt-10 text-center">
              <Button variant="outline" onClick={() => setShowMore(v => !v)}
                className="gap-2 border-violet-500/40 hover:bg-violet-500/10 hover:border-violet-500 hover:text-violet-500 transition-all px-8 py-5 text-sm">
                {showMore ? 'Show Less' : 'View More Projects'}
                <ChevronRight size={16} className={`transition-transform duration-300 ${showMore ? 'rotate-90' : ''}`} />
              </Button>
              {!showMore && <p className="mt-3 text-xs text-foreground/30">+{MORE_PROJECTS.length} more projects</p>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SKILLS
      ═════════════════════════════════════════════════════════════ */}
      <section id="skills" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal><SectionHeader title="Skills & Tech" sub="My toolkit" /></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SKILLS.map((s, i) => (
              <Reveal key={s.cat} delay={i * 80}>
                <TiltCard className="h-full">
                  <Card className="p-6 border-border/50 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 h-full dark:bg-card/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{s.icon}</span>
                      <h3 className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${s.grad}`}>{s.cat}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.items.map(skill => (
                        <Badge key={skill} className="bg-foreground/5 text-foreground/65 border-foreground/10 hover:border-violet-500/40 hover:text-violet-500 hover:bg-violet-500/5 transition-colors cursor-default text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          EXPERIENCE
      ═════════════════════════════════════════════════════════════ */}
      <section id="experience" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Reveal><SectionHeader title="Experience & Roles" sub="My journey" /></Reveal>
          <div className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-violet-500 via-pink-500 to-blue-400 opacity-25" />
            <div className="space-y-5 pl-14">
              {EXPERIENCE.map((exp, i) => (
                <Reveal key={i} delay={i * 100}>
                  <TiltCard>
                    <Card className="p-6 border-border/50 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 relative dark:bg-card/60 backdrop-blur-sm">
                      <div className={`absolute -left-[37px] top-6 w-4 h-4 rounded-full bg-gradient-to-br ${exp.grad} ring-2 ring-background shadow-lg`} />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-foreground text-[1.05rem]">{exp.role}</h3>
                          <p className={`text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r ${exp.grad}`}>{exp.company}</p>
                        </div>
                        <span className="text-xs text-foreground/35 bg-foreground/5 border border-border/50 px-3 py-1 rounded-full whitespace-nowrap font-mono self-start">{exp.period}</span>
                      </div>
                      <p className="text-sm text-foreground/55 leading-relaxed">{exp.description}</p>
                    </Card>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HIRE ME BANNER
      ═════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl p-12 text-center border border-violet-500/20">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5 pointer-events-none rounded-3xl" />
              <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-pink-400 to-blue-400">
                  Let&apos;s Work Together
                </h2>
                <p className="text-foreground/55 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                  Currently interning at BotCalm Pvt Ltd and open to collaborations, freelance projects, and exciting engineering opportunities. Let&apos;s connect!
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a href="mailto:thurga11252001@gmail.com">
                    <Button className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 border-0 shadow-lg shadow-violet-500/30 px-8 py-5 text-base transition-all hover:scale-105 active:scale-95 text-white">
                      <Mail size={19} />Send Email
                    </Button>
                  </a>
                  <a href="https://www.linkedin.com/in/thurgarajinathan25/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2 border-violet-500/40 hover:bg-violet-500/10 hover:border-violet-500 px-8 py-5 text-base transition-all hover:scale-105 active:scale-95">
                      <Linkedin size={19} />LinkedIn
                    </Button>
                  </a>
                </div>
                <p className="mt-6 text-xs text-foreground/25 tracking-widest uppercase">
                  Open to: Freelance · Collaboration · Full-time roles
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CONTACT  —  form + quick links
      ═════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal><SectionHeader title="Get in Touch" sub="Let's connect" /></Reveal>

          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* ── Contact form ── */}
            <Reveal delay={80}>
              <div className="grid-bg rounded-3xl border border-border/50 dark:border-border/40 overflow-hidden">
                <div className="bg-background/70 dark:bg-background/40 backdrop-blur-sm p-8 sm:p-10 h-full">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-[0.25em] mb-2">Get in Touch</p>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
                    Let&apos;s{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Connect.</span>
                  </h3>
                  <p className="text-foreground/45 text-sm mb-8 leading-relaxed">
                    Open to collaborations, freelance work, and conversations about AI, design, and engineering.
                  </p>

                  {formStatus === 'sent' ? (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                      <CheckCircle2 size={48} className="text-emerald-500" />
                      <h4 className="text-xl font-bold text-foreground">Message Sent!</h4>
                      <p className="text-foreground/50 text-sm">Thanks! I&apos;ll get back to you soon.</p>
                      <Button variant="outline" onClick={() => setFormStatus('idle')}
                        className="mt-2 border-violet-500/40 hover:bg-violet-500/10 hover:border-violet-500">
                        Send Another
                      </Button>
                    </div>
                  ) : formStatus === 'error' ? (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
                        <X size={28} className="text-red-500" />
                      </div>
                      <h4 className="text-xl font-bold text-foreground">Something went wrong</h4>
                      <p className="text-foreground/50 text-sm">Please try again or email me directly at thurga11252001@gmail.com</p>
                      <Button variant="outline" onClick={() => setFormStatus('idle')}
                        className="mt-2 border-violet-500/40 hover:bg-violet-500/10 hover:border-violet-500">
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-7">
                      <div className="grid sm:grid-cols-2 gap-7">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">Name</label>
                          <input name="name" required value={form.name} onChange={handleFormChange} placeholder="Your Name"
                            className="w-full bg-transparent border-0 border-b border-border/60 focus:border-violet-500 outline-none py-2 text-foreground placeholder:text-foreground/25 transition-colors text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">Email</label>
                          <input name="email" type="email" required value={form.email} onChange={handleFormChange} placeholder="your@email.com"
                            className="w-full bg-transparent border-0 border-b border-border/60 focus:border-violet-500 outline-none py-2 text-foreground placeholder:text-foreground/25 transition-colors text-sm" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">Subject</label>
                        <input name="subject" required value={form.subject} onChange={handleFormChange} placeholder="What's this about?"
                          className="w-full bg-transparent border-0 border-b border-border/60 focus:border-violet-500 outline-none py-2 text-foreground placeholder:text-foreground/25 transition-colors text-sm" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">Message</label>
                        <textarea name="message" required rows={4} value={form.message} onChange={handleFormChange} placeholder="Tell me what's on your mind..."
                          className="w-full bg-transparent border-0 border-b border-border/60 focus:border-violet-500 outline-none py-2 text-foreground placeholder:text-foreground/25 transition-colors text-sm resize-none" />
                      </div>

                      <Button type="submit" disabled={formStatus === 'sending'}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg shadow-blue-500/25 px-8 py-5 text-base transition-all hover:scale-105 active:scale-95 text-white rounded-2xl w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
                        <Send size={17} />{formStatus === 'sending' ? 'Sending…' : 'Send Message'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </Reveal>

            {/* ── Quick contact links ── */}
            <div className="space-y-4 lg:pt-4">
              {[
                { Icon: Github,   label: 'GitHub',   value: '@Thurga1125',                   sub: 'Check out my repos',            href: 'https://github.com/Thurga1125',                          grad: 'from-gray-600 to-slate-700' },
                { Icon: Linkedin, label: 'LinkedIn', value: 'Thurga Rajinathan',             sub: "Let's connect professionally",  href: 'https://www.linkedin.com/in/thurgarajinathan25/',         grad: 'from-blue-600 to-cyan-600' },
                { Icon: Mail,     label: 'Email',    value: 'thurga11252001@gmail.com',  sub: 'Drop me a line anytime',        href: 'mailto:thurga11252001@gmail.com',                    grad: 'from-violet-600 to-pink-600' },
              ].map(({ Icon, label, value, sub, href, grad }, i) => (
                <Reveal key={label} delay={i * 100}>
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                    <TiltCard>
                      <Card className="p-5 border-border/50 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 cursor-pointer group dark:bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            <Icon size={22} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground text-sm">{label}</h3>
                            <p className="text-xs text-foreground/55 truncate">{value}</p>
                            <p className="text-xs text-foreground/30 mt-0.5">{sub}</p>
                          </div>
                          <ExternalLink size={14} className="text-foreground/20 group-hover:text-violet-500 ml-auto flex-shrink-0 transition-colors" />
                        </div>
                      </Card>
                    </TiltCard>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-foreground/35">
            Designed &amp; built by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500 font-semibold">Thurga Rajinathan</span>
          </p>
          <p className="text-foreground/25 text-xs">Thurga Rajinathan's portfolio</p>
        </div>
      </footer>
    </div>
  )
}
