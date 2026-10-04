import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Button, Chip, Field, Icon, Input, Select } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { useToast } from '../context/ToastContext'

const DEMO = { email: 'priya@lpu.in', password: 'ridepair123' }

export default function Auth() {
  const { meta } = useMeta()
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
    gender: '', class_year: '', major: '', dorm: '',
  })
  const [agree, setAgree] = useState(true)
  const [shareContact, setShareContact] = useState(true)

  const domain = meta?.email_domains?.[0] || 'college.edu'
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const redirectTo = location.state?.from || '/find'

  const fillDemo = () => {
    setMode('login')
    setForm((f) => ({ ...f, email: DEMO.email, password: DEMO.password }))
    toast('Demo student loaded — just hit Log in', 'info')
  }

  async function submit(e) {
    e.preventDefault()
    if (mode === 'register') {
      if (form.password !== form.confirm) return toast('Passwords do not match.', 'error')
      if (!agree) return toast('Please accept the campus safety code of conduct.', 'error')
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        const user = await login({ email: form.email.trim(), password: form.password })
        toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success')
      } else {
        const user = await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          gender: form.gender || null,
          class_year: form.class_year || null,
          major: form.major || null,
          dorm: form.dorm || null,
          share_contact_on_match: shareContact,
        })
        toast(`You're verified, ${user.name.split(' ')[0]}! 🎓`, 'success')
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface p-margin md:p-space-xl">
      <div className="mx-auto grid max-w-[1200px] overflow-hidden rounded-2xl shadow-e3 lg:grid-cols-[0.9fr_1.1fr]">

        {/* ══════════ left: the trust pitch ══════════ */}
        <section className="relative overflow-hidden bg-primary p-space-xl text-on-primary">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-fixed/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-inverse-primary/20 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/90 px-space-md py-1 text-label-sm uppercase tracking-wider text-on-primary-fixed">
                <Icon name="shield_person" fill className="text-[0.95rem]" />
                Student trust protocol
              </span>
              <span className="text-label-sm text-primary-fixed-dim">v2.4 live</span>
            </div>

            <p className="mt-space-xl text-label-md uppercase tracking-[0.18em] text-primary-fixed-dim">
              Campus transit network
            </p>
            <h1 className="mt-space-sm font-headline text-display-lg">
              Safe, verified campus ride-sharing.
            </h1>
            <p className="mt-space-md max-w-md text-body-lg text-primary-fixed/90">
              College student verification required. Join your campus ride network using your
              official <strong className="text-white">@{domain}</strong> email to guarantee 100%
              verified student rides.
            </p>

            {/* identity preview */}
            <div className="mt-space-xl rounded-xl bg-white/10 p-space-md backdrop-blur-sm">
              <div className="flex items-center gap-space-sm">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                  {(form.name || 'Alex Chen').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-headline text-headline-sm">
                    {form.name || 'Your name'}
                  </div>
                  <div className="truncate text-body-sm text-primary-fixed-dim">
                    {meta?.college} · {form.class_year ? `'${form.class_year.slice(-2)}` : "'26"}
                  </div>
                </div>
                <Icon name="workspace_premium" fill className="text-2xl text-primary-fixed" />
              </div>
              <div className="mt-space-sm flex flex-wrap items-center gap-space-sm border-t border-white/15 pt-space-sm">
                <span className="inline-flex items-center gap-1 text-body-sm text-primary-fixed">
                  <Icon name="check_circle" fill className="text-[0.95rem]" />
                  @{domain} confirmed
                </span>
                <span className="rounded-full bg-white/15 px-space-sm py-0.5 text-label-sm">
                  Host &amp; passenger
                </span>
              </div>
            </div>

            {/* popular hubs */}
            <div className="mt-space-md rounded-xl bg-white/10 p-space-md backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <span className="text-label-sm uppercase tracking-wider text-primary-fixed-dim">
                  Popular campus hubs
                </span>
              </div>
              <div className="mt-space-sm flex flex-wrap gap-1.5">
                {(meta?.hubs || []).slice(0, 3).map((h) => (
                  <span
                    key={h.name}
                    className="rounded-full bg-white/15 px-space-sm py-1 text-label-sm"
                  >
                    {h.name.split('(')[0].trim()}
                  </span>
                ))}
              </div>
            </div>

            <ul className="mt-space-xl space-y-space-sm text-body-md text-primary-fixed/90">
              <li className="flex gap-space-sm">
                <Icon name="verified_user" className="text-lg text-primary-fixed" />
                Zero random public riders. Exclusively peer-to-peer.
              </li>
              <li className="flex gap-space-sm">
                <Icon name="payments" className="text-lg text-primary-fixed" />
                Zero platform surcharges. Direct cost splitting only.
              </li>
            </ul>
          </div>
        </section>

        {/* ══════════ right: the form ══════════ */}
        <section className="bg-surface-container-lowest p-space-lg md:p-space-xl">
          {/* demo sandbox strip */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-xl bg-secondary-fixed px-space-md py-space-sm">
            <span className="inline-flex items-center gap-1.5 text-label-lg text-on-secondary-fixed">
              <Icon name="bolt" fill className="text-lg text-secondary" />
              Hackathon demo sandbox
            </span>
            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-space-md py-1.5 text-label-md text-on-secondary transition-transform hover:-translate-y-0.5"
            >
              <Icon name="auto_fix_high" className="text-base" />
              Quick fill demo student
            </button>
          </div>

          {/* mode tabs */}
          <div className="mt-space-md grid grid-cols-2 gap-1 rounded-xl bg-surface-container p-1">
            {[
              { id: 'register', label: 'Register (New Student)', icon: 'person_add' },
              { id: 'login', label: 'Log In (Existing Student)', icon: 'login' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className="relative rounded-lg px-space-sm py-space-sm text-label-lg"
              >
                {mode === tab.id && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-lg bg-surface-container-lowest shadow-e1"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className={`relative flex items-center justify-center gap-1.5 ${
                    mode === tab.id ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  <Icon name={tab.icon} className="text-lg" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.id === 'login' ? 'Log in' : 'Register'}</span>
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-space-lg space-y-space-md">
            {mode === 'register' && (
              <div className="grid gap-space-md sm:grid-cols-2">
                <Field label="Full name">
                  <Input value={form.name} onChange={set('name')} placeholder="Priya Sharma" required minLength={2} />
                </Field>
                <Field label="Phone / WhatsApp for coordination">
                  <Input value={form.phone} onChange={set('phone')} placeholder="98765 00011" required minLength={6} />
                </Field>
              </div>
            )}

            <Field
              label={`Official university email (@${domain})`}
              hint={mode === 'register' ? `Must end in @${domain}` : undefined}
            >
              <Input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder={`you@${domain}`}
                required
                autoComplete="email"
              />
            </Field>

            {mode === 'register' && (
              <>
                <div className="grid gap-space-md sm:grid-cols-2">
                  <Field label="Class year">
                    <Select value={form.class_year} onChange={set('class_year')}>
                      <option value="">Select year</option>
                      {['2026', '2027', '2028', '2029'].map((y) => (
                        <option key={y} value={y}>Class of {y}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Branch / major">
                    <Input value={form.major} onChange={set('major')} placeholder="Computer Science" />
                  </Field>
                </div>

                <div className="grid gap-space-md sm:grid-cols-2">
                  <Field label="Hostel / campus living">
                    <Input value={form.dorm} onChange={set('dorm')} placeholder="Block 34, Boys Hostel" />
                  </Field>
                  <Field label="Gender" hint="powers same-gender ride filter">
                    <Select value={form.gender} onChange={set('gender')}>
                      <option value="">Prefer not to say</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                </div>
              </>
            )}

            <div className="grid gap-space-md sm:grid-cols-2">
              <Field label="Password">
                <Input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </Field>
              {mode === 'register' && (
                <Field label="Confirm password">
                  <Input
                    type="password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </Field>
              )}
            </div>

            {mode === 'register' && (
              <div className="space-y-space-sm">
                <Check checked={agree} onChange={setAgree}>
                  I agree to follow the <strong>campus safety code of conduct</strong> and maintain
                  mutual passenger respect.
                </Check>
                <Check checked={shareContact} onChange={setShareContact}>
                  Only show my contact info to students with an <strong>accepted ride match</strong>.
                </Check>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={busy} icon="mark_email_read">
              {mode === 'login' ? 'Log in to RidePair' : 'Verify with student email & join'}
            </Button>
          </form>

          {/* trust strip */}
          <div className="mt-space-lg grid gap-space-sm rounded-xl bg-surface-container-low p-space-md sm:grid-cols-3">
            {[
              { icon: 'shield', text: 'End-to-end verified campus community' },
              { icon: 'percent', text: 'Zero platform booking fees' },
              { icon: 'forward_to_inbox', text: 'Instant link to college inbox' },
            ].map((f) => (
              <div key={f.text} className="flex gap-1.5 text-body-sm text-on-surface-variant">
                <Icon name={f.icon} className="text-base text-primary" />
                {f.text}
              </div>
            ))}
          </div>

          <p className="mt-space-md text-center text-body-sm text-on-surface-variant">
            <Link to="/" className="text-secondary hover:underline">← Back to home</Link>
          </p>
        </section>
      </div>
    </div>
  )
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-space-sm text-body-md text-on-surface-variant">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2 transition-colors ${
          checked ? 'border-primary bg-primary text-on-primary' : 'border-outline'
        }`}
        aria-pressed={checked}
      >
        {checked && <Icon name="check" className="text-[0.85rem]" />}
      </button>
      <span>{children}</span>
    </label>
  )
}
