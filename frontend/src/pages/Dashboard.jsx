import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import CountUp from '../components/CountUp'
import RouteSpine from '../components/RouteSpine'
import {
  Avatar, Button, Card, Chip, EmptyState, HubChip, Icon, ProgressBar, SectionLabel, SkeletonCard,
} from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { useToast } from '../context/ToastContext'
import {
  HUB_ICON, addMinutes, departsIn, money, prettyDate, prettyTime,
} from '../lib/format'

export default function Dashboard() {
  const { user } = useAuth()
  const { meta } = useMeta()
  const toast = useToast()

  const [data, setData] = useState(null)
  const [tab, setTab] = useState('upcoming')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => toast(e.message, 'error'))
    api.campusStats().then(setStats).catch(() => {})
  }, [toast])

  const list = data ? (tab === 'upcoming' ? data.upcoming : data.past) : []
  const co2Pct = data ? (data.co2_kg / Math.max(1, data.co2_goal_kg)) * 100 : 0

  return (
    <div className="mx-auto max-w-[1200px] px-margin py-space-lg md:px-margin-md">
      {/* ══ welcome ══ */}
      <div className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <Chip tone="primary" icon="verified">
            {meta?.college} verified (@{meta?.email_domains?.[0]})
          </Chip>
          <h1 className="mt-space-sm font-headline text-headline-lg text-on-surface md:text-display-lg">
            Welcome back, {user?.name?.split(' ')[0]}!{' '}
            <motion.span
              animate={{ rotate: [0, 16, -8, 16, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block origin-[70%_70%]"
            >
              👋
            </motion.span>
          </h1>
          <p className="mt-1 max-w-xl text-body-md text-on-surface-variant">
            Coordinate zero-stress station splits and airport carpools with fellow verified
            classmates.
          </p>
        </div>

        <div className="flex flex-wrap gap-space-sm">
          <Button as={Link} to="/post" icon="add_circle">Post a new ride</Button>
          <Button as={Link} to="/find" variant="secondary" icon="explore">Browse all matches</Button>
        </div>
      </div>

      {/* ══ metric ribbon ══ */}
      <div className="mt-space-lg grid grid-cols-2 gap-gutter lg:grid-cols-4">
        <Metric
          label="Upcoming rides"
          value={<CountUp to={data?.upcoming_count || 0} />}
          sub="active this week"
          icon="commute"
          tone="primary"
        />
        <Metric
          label="Money saved"
          value={<CountUp to={data?.total_saved || 0} prefix="₹" />}
          sub="vs riding solo"
          icon="savings"
          tone="secondary"
        />
        <Metric
          label="CO₂ offset"
          value={<CountUp to={data?.co2_kg || 0} suffix=" kg" />}
          sub="emissions avoided"
          icon="eco"
          tone="primary"
        />
        <Metric
          label="Trust rating"
          value={data ? data.rating.toFixed(1) : '—'}
          sub={`★ ${user?.rides_hosted || 0} rides hosted`}
          icon="workspace_premium"
          tone="tertiary"
        />
      </div>

      <div className="mt-space-lg grid gap-gutter-lg lg:grid-cols-[1fr_20rem]">
        {/* ══════════ left ══════════ */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-space-sm">
            <div>
              <h2 className="font-headline text-headline-md text-on-surface">
                My active &amp; upcoming rides
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Live coordination status, campus pickup points and split tallies
              </p>
            </div>

            <div className="flex gap-1 rounded-xl bg-surface-container p-1">
              {[
                { id: 'upcoming', label: `Upcoming (${data?.upcoming.length ?? 0})` },
                { id: 'past', label: `Past history (${data?.past.length ?? 0})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="relative rounded-lg px-space-md py-space-sm text-label-md"
                >
                  {tab === t.id && (
                    <motion.span
                      layoutId="dash-tab"
                      className="absolute inset-0 rounded-lg bg-surface-container-lowest shadow-e1"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span
                    className={`relative ${tab === t.id ? 'text-primary' : 'text-on-surface-variant'}`}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-space-md space-y-gutter">
            {!data && (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {data && list.length === 0 && (
              <EmptyState
                icon={tab === 'upcoming' ? 'directions_car' : 'history'}
                title={tab === 'upcoming' ? 'No upcoming rides yet' : 'No past trips yet'}
                body={
                  tab === 'upcoming'
                    ? 'Post a ride or join a match and it will show up here with the full co-rider roster.'
                    : 'Completed trips will be archived here with what you saved on each one.'
                }
                action={<Button as={Link} to="/find" icon="search">Find a match</Button>}
              />
            )}

            <AnimatePresence mode="popLayout">
              {data &&
                list.map((ride, i) => (
                  <MyRideCard key={ride.id} ride={ride} index={i} me={user} />
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ══════════ right ══════════ */}
        <aside className="space-y-gutter lg:sticky lg:top-20 lg:self-start">
          {/* safety */}
          <Card className="p-space-md">
            <div className="flex items-center gap-1.5">
              <Icon name="shield" fill className="text-lg text-primary" />
              <h3 className="font-headline text-headline-sm text-on-surface">Campus ride safety</h3>
            </div>
            <p className="mt-space-sm text-body-sm text-on-surface-variant">
              Every passenger and host holds an active, verified campus identity. Keep these habits:
            </p>
            <ul className="mt-space-md space-y-space-md">
              {[
                { icon: 'wb_twilight', title: 'Meet in well-lit hubs',
                  body: 'Prefer the Uni Mall archway, hostel gates or main gate over isolated roads.' },
                { icon: 'badge', title: 'Verify the student card',
                  body: 'Cross-check the name against the RidePair roster before getting in.' },
                { icon: 'share_location', title: 'Share the trip link',
                  body: 'Send your live location to a roommate or the hostel warden.' },
              ].map((s) => (
                <li key={s.title} className="flex gap-space-sm">
                  <Icon name={s.icon} className="text-lg text-primary" />
                  <div>
                    <div className="text-label-lg text-on-surface">{s.title}</div>
                    <div className="text-body-sm text-on-surface-variant">{s.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* hubs */}
          <Card className="p-space-md">
            <div className="flex items-baseline justify-between">
              <h3 className="font-headline text-headline-sm text-on-surface">Quick transit hubs</h3>
              <span className="text-label-sm text-on-surface-variant">Popular this week</span>
            </div>
            <ul className="mt-space-sm space-y-1">
              {(stats?.hubs || []).slice(0, 4).map((hub) => (
                <li key={hub.name}>
                  <Link
                    to="/find"
                    className="flex items-center gap-space-sm rounded-lg p-space-sm transition-colors hover:bg-surface-container-low"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container text-on-surface-variant">
                      <Icon name={HUB_ICON[hub.category]} className="text-lg" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label-lg text-on-surface">
                        {hub.name.split('(')[0].trim()}
                      </span>
                      <span className="block truncate text-body-sm text-on-surface-variant">
                        ~{money(hub.avg_share)} per student
                      </span>
                    </span>
                    <span className="rounded-full bg-surface-container-high px-space-sm py-0.5 text-label-sm tnum text-on-surface-variant">
                      {hub.active_rides}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* impact */}
          <Card className="overflow-hidden bg-primary p-space-md text-on-primary">
            <div className="flex items-start justify-between">
              <SectionLabel>
                <span className="text-primary-fixed-dim">Campus impact</span>
              </SectionLabel>
              <Icon name="forest" fill className="text-xl text-primary-fixed" />
            </div>
            <h3 className="font-headline text-headline-sm">Your carpool contribution</h3>
            <p className="mt-space-sm text-body-sm text-primary-fixed/90">
              By sharing {data?.trips_shared ?? 0} trips with classmates, you kept about{' '}
              <strong className="text-white">{data?.co2_kg ?? 0} kg</strong> of CO₂ off the highway.
            </p>
            <div className="mt-space-md">
              <ProgressBar value={co2Pct} className="bg-white/20" />
              <div className="mt-1 flex justify-between text-label-sm text-primary-fixed">
                <span>Goal: {data?.co2_goal_kg ?? 50} kg</span>
                <span className="tnum">{Math.round(co2Pct)}% achieved</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

/* ─────────── metric tile ─────────── */
function Metric({ label, value, sub, icon, tone }) {
  const tones = {
    primary: 'bg-primary-fixed/50 text-primary',
    secondary: 'bg-secondary-fixed text-secondary',
    tertiary: 'bg-tertiary-fixed text-tertiary',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card hover className="flex items-center justify-between gap-space-sm p-space-md">
        <div className="min-w-0">
          <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {label}
          </div>
          <div className="font-headline text-headline-lg text-on-surface">{value}</div>
          <div className="truncate text-label-sm text-primary">{sub}</div>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon name={icon} className="text-xl" />
        </span>
      </Card>
    </motion.div>
  )
}

/* ─────────── one of my rides ─────────── */
function MyRideCard({ ride, index, me }) {
  const others = [ride.creator, ...ride.riders].filter((p) => p.id !== me?.id)
  const isPast = new Date(`${ride.ride_date}T23:59:59`) < new Date()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.4 }}
    >
      <Card hover className="p-space-md sm:p-space-lg">
        <div className="flex flex-wrap items-center gap-space-sm">
          <HubChip category={ride.hub_category} />
          <Chip tone={ride.is_mine ? 'primary' : 'secondary'} icon={ride.is_mine ? 'star' : 'group'}>
            {ride.is_mine ? "You're the host" : `Host: ${ride.creator.name.split(' ')[0]}`}
          </Chip>
          {ride.status === 'full' ? (
            <Chip tone="primary" icon="check_circle">Roster confirmed</Chip>
          ) : (
            <Chip tone="warning" icon="hourglass_top">
              {ride.riders_count} of {ride.seats_total + 1} seats filled
            </Chip>
          )}
          {!isPast && (
            <span className="ml-auto text-label-sm text-on-surface-variant">
              {departsIn(ride.ride_date, ride.depart_time)}
            </span>
          )}
        </div>

        <div className="mt-space-md grid gap-space-md lg:grid-cols-[1fr_auto]">
          <div>
            <h3 className="font-headline text-headline-sm text-on-surface">{ride.to_location}</h3>
            <div className="mt-space-sm">
              <RouteSpine
                from={ride.from_location}
                fromDetail={`${prettyDate(ride.ride_date)} · ${prettyTime(ride.depart_time)}`}
                to={ride.drop_detail || ride.to_location}
                toDetail={`Est. arrival ${prettyTime(addMinutes(ride.depart_time, ride.est_duration_min))}`}
                category={ride.hub_category}
                compact
              />
            </div>
          </div>

          {/* roster panel */}
          <div className="min-w-[15rem] rounded-xl bg-surface-container-low p-space-md">
            <div className="flex items-center justify-between">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                Rider roster
              </span>
              <span className="text-label-sm tnum text-on-surface-variant">
                {Math.max(0, ride.seats_available)} open
              </span>
            </div>

            <div className="mt-space-sm flex -space-x-2">
              {[ride.creator, ...ride.riders].map((p) => (
                <Avatar key={p.id} name={p.name} size="sm" className="ring-2 ring-surface-container-low" />
              ))}
              {Array.from({ length: Math.max(0, ride.seats_available) }, (_, i) => (
                <span
                  key={i}
                  className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant ring-2 ring-surface-container-low"
                >
                  <Icon name="person_add" className="text-sm" />
                </span>
              ))}
            </div>

            <p className="mt-space-sm text-body-sm text-on-surface-variant">
              {others.length
                ? others.map((p) => p.name.split(' ')[0]).join(', ')
                : 'Waiting for co-travellers…'}
            </p>

            <div className="mt-space-sm flex items-end justify-between border-t border-outline-variant/40 pt-space-sm">
              <div>
                <div className="text-label-sm text-on-surface-variant">Est. cab total</div>
                <div className="tnum text-on-surface-variant line-through">
                  {money(ride.solo_fare)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-label-sm text-primary">Your share</div>
                <div className="font-headline text-headline-sm tnum text-primary">
                  {money(ride.fare_per_seat)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* contacts */}
        {others.some((p) => p.phone) && (
          <div className="mt-space-md flex flex-wrap gap-space-sm border-t border-outline-variant/40 pt-space-md">
            {others
              .filter((p) => p.phone)
              .map((p) => (
                <a
                  key={p.id}
                  href={`tel:${p.phone}`}
                  className="inline-flex items-center gap-space-sm rounded-full bg-surface-container-low py-1 pl-1 pr-space-md transition-colors hover:bg-surface-container"
                >
                  <Avatar name={p.name} size="xs" />
                  <span className="text-label-md text-on-surface">{p.name.split(' ')[0]}</span>
                  <span className="text-body-sm tnum text-primary">{p.phone}</span>
                </a>
              ))}
          </div>
        )}

        <div className="mt-space-md flex flex-wrap gap-space-sm">
          <Button as={Link} to={`/ride/${ride.id}`} variant="outline" size="sm" icon="visibility">
            View details
          </Button>
          {!isPast && (
            <Button as={Link} to="/find" variant="ghost" size="sm" icon="person_search">
              Find more co-riders
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
