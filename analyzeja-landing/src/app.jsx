import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { enabled, db, auth, signInAnonymously } from './lib/firebase'
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { addLocalEmail, subscribeLocal, subscribeLocalList } from './lib/localWaitlist'

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return { d, h, m, sec }
}

function Landing() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [joined, setJoined] = useState(0)
  const [joinedLocal, setJoinedLocal] = useState(0)
  const launchAt = useMemo(() => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), [])
  const [remaining, setRemaining] = useState(launchAt.getTime() - Date.now())
  const navigate = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setRemaining(launchAt.getTime() - Date.now()), 1000)
    return () => clearInterval(t)
  }, [launchAt])

  useEffect(() => {
    if (!enabled) return
    signInAnonymously(auth)
    const unsub = onSnapshot(
      collection(db, 'waitlist'),
      (snap) => setJoined(snap.size),
      () => setStatus('Live count unavailable')
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeLocal(setJoinedLocal)
    return () => unsub()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    const isValid = /.+@.+\..+/.test(email)
    if (!isValid) {
      setStatus('Enter a valid email')
      return
    }
    try {
      if (!enabled) {
        setStatus('Saved')
        addLocalEmail(email)
        navigate('/waitlist', { state: { email } })
        return
      }
      if (!auth.currentUser) await signInAnonymously(auth)
      await addDoc(collection(db, 'waitlist'), { email, createdAt: serverTimestamp() })
      setStatus('Joined')
      setEmail('')
      addLocalEmail(email)
      navigate('/waitlist', { state: { email } })
    } catch (err) {
      setStatus('Try again')
    }
  }

  const t = formatTime(remaining)

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">AnalyzeJA.ai</div>
          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <Link to="/admin" className="underline underline-offset-4">Admin</Link>
            <span>Launch in 3 days</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">ATS-Optimized Resume Insights</h1>
          <p className="mt-4 text-neutral-100">
            Get recruiter-ready feedback that improves your ATS score and interview chances.
          </p>

          <div className="mt-8 flex justify-center gap-6 text-white">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3">
              <span className="text-2xl font-bold">{t.d}</span>
              <span className="text-sm">Days</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3">
              <span className="text-2xl font-bold">{t.h}</span>
              <span className="text-sm">Hours</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3">
              <span className="text-2xl font-bold">{t.m}</span>
              <span className="text-sm">Minutes</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3">
              <span className="text-2xl font-bold">{t.sec}</span>
              <span className="text-sm">Seconds</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-xl gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              className="rounded-xl bg-black/80 px-5 py-3 font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-black"
            >
              Join Waitlist
            </button>
          </form>
          <div className="mt-3 text-sm text-white/80">
            {(enabled ? joined : joinedLocal) + ' people joined'}
          </div>
          {status && <div className="mt-3 text-sm text-white">{status}</div>}
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">ATS Score Boost</h3>
            <p className="mt-2 text-sm text-neutral-300">Instant recommendations to align resumes with ATS parsing.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Keyword Gap Discovery</h3>
            <p className="mt-2 text-sm text-neutral-300">Detect missing role-specific keywords and phrasing.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Role-tailored Feedback</h3>
            <p className="mt-2 text-sm text-neutral-300">Guidance tuned for job descriptions and seniority.</p>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} AnalyzeJA.ai
      </footer>
    </div>
  )
}

function WaitlistPage() {
  const loc = useLocation()
  const [joined, setJoined] = useState(0)
  const [joinedLocal, setJoinedLocal] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const unsub = onSnapshot(
      collection(db, 'waitlist'),
      (snap) => setJoined(snap.size)
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeLocal(setJoinedLocal)
    return () => unsub()
  }, [])

  return (
    <div className="min-h-dvh bg-black text-white">
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold">You’re on the waitlist</h1>
        <p className="mt-4 text-neutral-300">Thanks for joining. We’ll notify you at {loc.state?.email ?? 'your email'}.</p>
        <div className="mt-6 text-sm text-white/70">{(enabled ? joined : joinedLocal) + ' people joined so far'}</div>
        <div className="mt-10">
          <Link to="/" className="rounded-xl bg-white/10 px-5 py-3 text-white ring-1 ring-inset ring-white/20">Back to home</Link>
        </div>
      </main>
    </div>
  )
}

function AdminPage() {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [authed, setAuthed] = useState(false)
  const [joined, setJoined] = useState(0)
  const [joinedLocal, setJoinedLocal] = useState(0)
  const [emails, setEmails] = useState([])
  const [emailsLocal, setEmailsLocal] = useState([])

  const ADMIN_USER = 'dev_admin'
  const ADMIN_PASS = 'A9x!zRq3'

  useEffect(() => {
    if (!enabled || !authed) return
    const unsub = onSnapshot(
      collection(db, 'waitlist'),
      (snap) => {
        setJoined(snap.size)
        setEmails(
          snap.docs
            .map((d) => d.data()?.email)
            .filter(Boolean)
        )
      },
      () => setErr('Permission denied or missing rules')
    )
    return () => unsub()
  }, [authed])

  useEffect(() => {
    const unsubCount = subscribeLocal(setJoinedLocal)
    const unsubList = subscribeLocalList(setEmailsLocal)
    return () => {
      unsubCount()
      unsubList()
    }
  }, [])

  function login(e) {
    e.preventDefault()
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      setAuthed(true)
      setErr('')
    } else {
      setErr('Invalid credentials')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-dvh bg-black text-white">
        <main className="mx-auto max-w-sm px-6 py-20">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <form onSubmit={login} className="mt-6 space-y-3">
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder="Username" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60" />
            <input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60" />
            <button className="w-full rounded-xl bg-white/10 px-5 py-3 text-white ring-1 ring-inset ring-white/20">Sign in</button>
            {err && <div className="text-sm text-red-300">{err}</div>}
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black text-white">
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-neutral-300">Total waitlist</div>
          <div className="mt-2 text-4xl font-bold">{enabled ? joined : joinedLocal}</div>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-neutral-300">Emails</div>
          <ul className="mt-3 space-y-2">
            {(enabled ? emails : emailsLocal.map((e) => e.email)).map((em, i) => (
              <li key={i} className="rounded-xl bg-white/5 px-4 py-2 text-white">{em}</li>
            ))}
            {((enabled ? emails : emailsLocal).length === 0) && (
              <li className="text-sm text-neutral-400">No entries yet</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/waitlist" element={<WaitlistPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
