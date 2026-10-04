import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import CountUp from '../components/CountUp'
import { Avatar, Button, Card, Chip, Field, Icon, Input, Select } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { HUB_ICON, HUB_LABEL, money, todayISO } from '../lib/format'

export default function Landing() {
  const { meta } = useMeta()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  const [query, setQuery] = useState({
    from_location: '',
    to_location: '',
    ride_date: todayISO(),
    depart_time: '17:00',
  })

  useEffect(() => {
    api.campusStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    if (!meta) return
    setQuery((q) => ({
      ...q,
      from_location: q.from_location || meta.pickup_points[0]?.name || '',
      to_location: q.to_location || meta.hubs[0]?.name || '',
    }))
  }, [meta])

  function search(e) {
    e.preventDefault()
    const params = new URLSearchParams(query)
    navigate(isLoggedIn ? `/find?${params}` : '/auth', {
      state: isLoggedIn ? undefined : { from: `/find?${params}` },
    })
  }

  const topHubs = (stats?.hubs || []).slice(0, 3)

  return (
    <div className="bg-surface">
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-primary-fixed/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-80 w-80 rounded-full bg-secondary-fixed/40 blur-3xl" />

        <div className="relative mx-auto max-w-[1200px] px-margin pt-space-xl md:px-margin-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid items-center gap-gutter-lg lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <Chip tone="primary" icon="radio_button_checked">
                {meta?.college_short || 'Campus'} network active ·{' '}
                <span className="tnum">{stats?.verified_students ?? '—'}</span> verified students
              </Chip>

              <h1 className="mt-space-md font-headline text-[2rem] leading-[2.4rem] tracking-tight text-on-surface md:text-display-lg">
                Split Cabs. Save Money.
                <br />
                <span className="relative inline-block text-primary">
                  Travel Safer Together.
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-primary-fixed-dim"
                  />
                </span>
              </h1>

              <p className="mt-space-md max-w-xl text-body-lg text-on-surface-variant">
                Find fellow verified students heading to the railway station, airport or bus stand
                for breaks and weekends. Split the fare up to 75% without the awkward hostel-group
                negotiation.
              </p>

              {/* proof strip */}
              <div className="mt-space-lg flex flex-wrap items-center gap-space-lg">
                <Stat
                  icon="savings"
                  value={<CountUp to={stats?.total_saved || 0} prefix="₹" />}
                  label="saved by batchmates"
                />
                <Stat
                  icon="route"
                  value={<CountUp to={stats?.completed_runs || 0} suffix="+" />}
                  label="shared runs completed"
                />
                <div className="flex items-center gap-space-sm">
                  <span className="flex -space-x-2">
                    {['Priya Sharma', 'Arjun Mehta', 'Neha Bansal', 'Vikram Chauhan'].map((n) => (
                      <Avatar key={n} name={n} size="sm" className="ring-2 ring-surface" />
                    ))}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    +{stats?.verified_students ?? 0} on campus
                  </span>
                </div>
              </div>
            </div>

            {/* hero preview card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <Card className="overflow-hidden">
                <div className="relative h-44 bg-gradient-to-br from-primary via-primary-container to-tertiary p-space-lg">
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                  <div className="absolute bottom-4 right-4 h-24 w-24 rounded-full bg-white/5" />
                  <Icon name="local_taxi" fill className="text-5xl text-white/90" />
                  <p className="mt-space-sm max-w-[16rem] font-headline text-headline-sm text-white">
                    Four students. One cab. One fare, split four ways.
                  </p>
                </div>

                <div className="p-space-md">
                  <div className="flex items-center justify-between gap-space-sm">
                    <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Live example
                    </span>
                    <Chip tone="primary" icon="bolt">92% match</Chip>
                  </div>

                  <div className="mt-space-sm flex items-end justify-between gap-space-sm">
                    <div>
                      <div className="text-body-sm text-on-surface-variant">Solo cab to the station</div>
                      <div className="font-headline text-headline-md tnum text-on-surface-variant line-through">
                        {money(topHubs[0]?.fare || 700)}
                      </div>
                    </div>
                    <Icon name="arrow_forward" className="mb-2 text-xl text-primary" />
                    <div className="text-right">
                      <div className="text-body-sm text-primary">Shared 4 ways</div>
                      <div className="font-headline text-headline-lg tnum text-primary">
                        {money(Math.round((topHubs[0]?.fare || 700) / 4))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* ══════════════════ SEARCH WIDGET ══════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-space-xl"
          >
            <Card className="p-space-lg">
              <div className="flex flex-wrap items-baseline justify-between gap-space-sm">
                <div>
                  <div className="text-label-sm uppercase tracking-wider text-secondary">
                    Instant campus discovery
                  </div>
                  <h2 className="font-headline text-headline-md text-on-surface">
                    Find your route &amp; match batchmates
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 text-body-sm text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="tnum">{stats?.students_travelling ?? 0}</span> students travelling soon
                </span>
              </div>

              <form onSubmit={search} className="mt-space-md grid gap-space-md lg:grid-cols-[repeat(4,1fr)_auto]">
                <Field label="Pick-up point">
                  <Select
                    value={query.from_location}
                    onChange={(e) => setQuery({ ...query, from_location: e.target.value })}
                  >
                    {(meta?.pickup_points || []).map((p) => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Transit hub">
                  <Select
                    value={query.to_location}
                    onChange={(e) => setQuery({ ...query, to_location: e.target.value })}
                  >
                    {(meta?.hubs || []).map((h) => (
                      <option key={h.name} value={h.name}>{h.name}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Travel day">
                  <Input
                    type="date"
                    value={query.ride_date}
                    min={todayISO()}
                    onChange={(e) => setQuery({ ...query, ride_date: e.target.value })}
                  />
                </Field>

                <Field label="Departure time">
                  <Input
                    type="time"
                    value={query.depart_time}
                    onChange={(e) => setQuery({ ...query, depart_time: e.target.value })}
                  />
                </Field>

                <div className="flex items-end">
                  <Button type="submit" size="lg" iconRight="arrow_forward" className="w-full lg:w-auto">
                    Find matches
                  </Button>
                </div>
              </form>

              <p className="mt-space-sm flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <Icon name="lock" className="text-base text-primary" />
                All riders authenticated via @{meta?.email_domains?.[0]} — no public guest access.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ HIGH-FREQUENCY RUNS ══════════════════ */}
      <Section
        label="Campus hubs"
        title="High-frequency transit runs"
        action={
          <Link to="/find" className="text-label-lg text-secondary hover:underline">
            View all {meta?.hubs?.length || 0} routes →
          </Link>
        }
      >
        <div className="grid gap-gutter md:grid-cols-3">
          {topHubs.map((hub, i) => (
            <motion.div
              key={hub.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card hover className="h-full p-space-md">
                <div className="flex items-center justify-between gap-space-sm">
                  <Chip
                    tone={{ airport: 'tertiary', rail: 'secondary', bus: 'primary' }[hub.category]}
                    icon={HUB_ICON[hub.category]}
                  >
                    {HUB_LABEL[hub.category]}
                  </Chip>
                  <span className="text-label-sm tnum text-primary">
                    {hub.active_rides} rides active
                  </span>
                </div>

                <h3 className="mt-space-md font-headline text-headline-sm text-on-surface">
                  {hub.name}
                </h3>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">{hub.detail}</p>

                <div className="mt-space-md flex items-center justify-between border-t border-outline-variant/40 pt-space-sm">
                  <div>
                    <div className="text-label-sm text-on-surface-variant">Avg. split</div>
                    <div className="font-headline text-headline-sm tnum text-primary">
                      {money(hub.avg_share)}
                      <span className="text-body-sm font-normal text-on-surface-variant">/person</span>
                    </div>
                  </div>
                  <Button as={Link} to="/find" variant="secondary" size="sm" iconRight="chevron_right">
                    View route
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ══════════════════ SAFETY ══════════════════ */}
      <Section
        label="Student safety architecture"
        title="Designed specifically for collegiate peace of mind."
        sub="Unlike open public rideshare boards, every RidePair traveller is vetted, synchronised by actual departure timetables, and connected without platform friction."
      >
        <div className="grid gap-gutter md:grid-cols-3">
          {[
            {
              icon: 'school', tone: 'primary',
              kicker: 'Institutional verification',
              title: `100% verified @${meta?.email_domains?.[0]} only`,
              body: 'Every rider and ride-poster must authenticate with an active university email. No random strangers, no anonymous accounts.',
              foot: 'Zero public guest access',
            },
            {
              icon: 'schedule', tone: 'secondary',
              kicker: 'Intelligent sync',
              title: 'Exact schedule match',
              body: 'Our matching engine groups students leaving within minutes of each other, ranked by a transparent compatibility score.',
              foot: 'Tight departure windows',
            },
            {
              icon: 'payments', tone: 'tertiary',
              kicker: 'No overhead',
              title: 'Zero platform fees',
              body: 'No hidden fees, no surge markup, no escrow delays. Book your own cab and split the fare natively between students.',
              foot: '₹0 RidePair platform charges',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <Card hover className="h-full p-space-md">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl ${
                    { primary: 'bg-primary-fixed/50 text-primary',
                      secondary: 'bg-secondary-fixed text-secondary',
                      tertiary: 'bg-tertiary-fixed text-tertiary' }[f.tone]
                  }`}
                >
                  <Icon name={f.icon} className="text-xl" />
                </span>
                <div className="mt-space-md text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {f.kicker}
                </div>
                <h3 className="mt-1 font-headline text-headline-sm text-on-surface">{f.title}</h3>
                <p className="mt-space-sm text-body-md text-on-surface-variant">{f.body}</p>
                <div className="mt-space-md flex items-center gap-1.5 border-t border-outline-variant/40 pt-space-sm text-body-sm text-primary">
                  <Icon name="check_circle" fill className="text-base" />
                  {f.foot}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ══════════════════ THREE STEPS ══════════════════ */}
      <Section label="Three simple steps" title="From hostel gate to terminal gate" center>
        <div className="grid gap-gutter md:grid-cols-3">
          {[
            { n: 1, tag: 'Setup', title: 'Post or search a ride',
              body: 'Enter your campus pickup spot, your target train or flight time, and how much luggage you are bringing.',
              foot: `Supports ${meta?.hubs?.length || 0} transit hubs` },
            { n: 2, tag: 'Pairing', title: 'Review matches & specs',
              body: 'Review matching students with compatibility percentages, luggage capacity, remaining seats and verified college credentials.',
              foot: 'Transparent match % algorithm' },
            { n: 3, tag: 'Meet & ride', title: 'Meet at the gate & split',
              body: 'Regroup at the agreed campus gate, book your ride on any cab app, and split the fare evenly via UPI.',
              foot: 'Split fare evenly in 1 click' },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
            >
              <Card className="h-full p-space-md">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-headline text-label-lg text-on-primary">
                    {s.n}
                  </span>
                  <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    {s.tag}
                  </span>
                </div>
                <h3 className="mt-space-md font-headline text-headline-sm text-on-surface">{s.title}</h3>
                <p className="mt-space-sm text-body-md text-on-surface-variant">{s.body}</p>
                <div className="mt-space-md rounded-lg bg-surface-container-low px-space-sm py-1.5 text-body-sm text-on-surface-variant">
                  {s.foot}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* fare comparison */}
        <Card className="mt-gutter flex flex-wrap items-center gap-space-md p-space-md">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-fixed/50 text-primary">
            <Icon name="paid" className="text-xl" />
          </span>
          <div className="mr-auto">
            <div className="font-headline text-headline-sm text-on-surface">
              Average solo cab vs. RidePair 4-student split
            </div>
            <div className="text-body-sm text-on-surface-variant">
              Based on a standard peak-hour fare to {topHubs[0]?.name || 'the station'}
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="text-right">
              <div className="text-label-sm uppercase text-on-surface-variant">Solo ride</div>
              <div className="font-headline text-headline-md tnum text-on-surface-variant line-through">
                {money(topHubs[0]?.fare || 700)}
              </div>
            </div>
            <Icon name="arrow_forward" className="text-xl text-primary" />
            <div className="text-right">
              <div className="text-label-sm uppercase text-primary">RidePair (4×)</div>
              <div className="font-headline text-headline-lg tnum text-primary">
                {money(Math.round((topHubs[0]?.fare || 700) / 4))}
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* ══════════════════ CTA ══════════════════ */}
      <div className="mx-auto max-w-[1200px] px-margin pb-space-2xl md:px-margin-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-primary p-space-xl text-on-primary"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-center gap-gutter-lg">
            <div className="min-w-[18rem] flex-1">
              <Chip tone="primary" className="bg-white/20 text-white" icon="favorite">
                Student mobility initiative
              </Chip>
              <h2 className="mt-space-md max-w-xl font-headline text-headline-lg">
                “Built by students, for students.”
              </h2>
              <p className="mt-space-sm max-w-xl text-body-lg text-primary-fixed/90">
                Eliminating the frantic “who is going to the station at 6 AM?” hostel-group
                shouting. Let&apos;s make campus commuting sustainable, social and budget-friendly.
              </p>
            </div>
            <div className="flex flex-col gap-space-sm">
              <Button
                as={Link}
                to={isLoggedIn ? '/post' : '/auth'}
                variant="secondary"
                size="lg"
                icon="add_circle"
                className="bg-white text-primary hover:bg-white/90"
              >
                Post your ride free
              </Button>
              <Button
                as={Link}
                to={isLoggedIn ? '/find' : '/auth'}
                size="lg"
                icon="search"
                className="bg-white/15 text-white hover:bg-white/25"
              >
                Browse active board
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ─────────── helpers ─────────── */
function Stat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-space-sm">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-fixed/50 text-primary">
        <Icon name={icon} className="text-lg" />
      </span>
      <div>
        <div className="font-headline text-headline-sm text-on-surface">{value}</div>
        <div className="text-body-sm text-on-surface-variant">{label}</div>
      </div>
    </div>
  )
}

function Section({ label, title, sub, action, center, children }) {
  return (
    <section className="mx-auto max-w-[1200px] px-margin py-space-xl md:px-margin-md">
      <div
        className={`mb-space-lg flex flex-wrap items-end justify-between gap-space-sm ${
          center ? 'flex-col items-center text-center' : ''
        }`}
      >
        <div className={center ? 'text-center' : ''}>
          {label && (
            <div className="text-label-sm uppercase tracking-wider text-secondary">{label}</div>
          )}
          <h2 className="mt-1 font-headline text-headline-lg text-on-surface">{title}</h2>
          {sub && <p className="mt-space-sm max-w-2xl text-body-md text-on-surface-variant">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
