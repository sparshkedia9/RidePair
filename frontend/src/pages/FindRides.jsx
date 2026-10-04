import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import MatchCard from '../components/MatchCard'
import {
  Button, Card, Chip, Field, Icon, Input, Select, EmptyState, SkeletonCard, SectionLabel, ProgressBar,
} from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { useToast } from '../context/ToastContext'
import { money, prettyDate, prettyTime, todayISO } from '../lib/format'

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'strong', label: '90%+ match', test: (m) => m.score >= 90 },
  { id: 'airport', label: 'Airport runs', test: (m) => m.ride.hub_category === 'airport' },
  { id: 'rail', label: 'Rail / station', test: (m) => m.ride.hub_category === 'rail' },
  { id: 'luggage', label: 'Large luggage OK', test: (m) => m.ride.luggage === 'checked' },
  { id: 'gender', label: 'Same-gender rides', test: (m) => m.ride.gender_only },
]

export default function FindRides() {
  const { meta } = useMeta()
  const { user } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()

  const [query, setQuery] = useState(() => ({
    ride_type: 'seek',
    from_location: params.get('from_location') || '',
    to_location: params.get('to_location') || '',
    ride_date: params.get('ride_date') || todayISO(),
    depart_time: params.get('depart_time') || '17:00',
    time_flex: 30,
    group_size: 1,
    luggage: 'carryon',
  }))

  const [matches, setMatches] = useState(null)
  const [loading, setLoading] = useState(false)
  const [joiningId, setJoiningId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)

  // Fill in defaults from campus config once it arrives.
  useEffect(() => {
    if (!meta) return
    setQuery((q) => ({
      ...q,
      from_location: q.from_location || meta.pickup_points[0]?.name || '',
      to_location: q.to_location || meta.hubs[0]?.name || '',
    }))
  }, [meta])

  const run = useCallback(
    async (q) => {
      if (!q.from_location || !q.to_location) return
      setLoading(true)
      try {
        setMatches(await api.match(q))
      } catch (err) {
        toast(err.message, 'error')
        setMatches([])
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  // Search automatically on arrival — the results page is never empty-handed.
  useEffect(() => {
    if (query.from_location && query.to_location && matches === null && !loading) {
      run(query)
    }
  }, [query, matches, loading, run])

  const counts = useMemo(() => {
    const list = matches || []
    return FILTERS.reduce((acc, f) => ({ ...acc, [f.id]: list.filter(f.test).length }), {})
  }, [matches])

  const visible = useMemo(() => {
    const def = FILTERS.find((f) => f.id === filter) || FILTERS[0]
    return (matches || []).filter(def.test)
  }, [matches, filter])

  const bestSaving = Math.max(0, ...(matches || []).map((m) => m.you_save))
  const avgShare = matches?.length
    ? Math.round(matches.reduce((s, m) => s + m.your_share, 0) / matches.length)
    : 0
  const soloFare = matches?.[0]?.ride?.solo_fare || 0

  async function join(rideId) {
    setJoiningId(rideId)
    try {
      const ride = await api.join(rideId)
      toast(
        `Seat confirmed on ${ride.to_location}. ${ride.creator.name.split(' ')[0]}'s number is now on your dashboard.`,
        'success'
      )
      setMatches((list) => (list || []).filter((m) => m.ride.id !== rideId))
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-margin py-space-lg md:px-margin-md">
      {/* ══ page head ══ */}
      <div className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <Chip tone="primary" icon="sensors">
            Real-time {meta?.college_short} carpool network
          </Chip>
          <h1 className="mt-space-sm font-headline text-headline-lg text-on-surface">
            Coordinated rides &amp; hub carpools
          </h1>
          <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
            Matching verified {meta?.college_short} students heading to airports, railway stations
            and interstate terminals around your departure window.
          </p>
        </div>
      </div>

      {/* ══ search bar ══ */}
      <Card className="mt-space-md p-space-md">
        <div className="flex flex-wrap items-center gap-space-sm">
          <Summary icon="route" label="Route">
            {query.from_location?.split('/')[0].trim()} → {query.to_location?.split('(')[0].trim()}
          </Summary>
          <Summary icon="event" label="Date">{prettyDate(query.ride_date)}</Summary>
          <Summary icon="schedule" label="Departure window">
            {prettyTime(query.depart_time)} ± {query.time_flex}m
          </Summary>

          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            icon="tune"
            className="ml-auto"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Close' : 'Modify'}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {showForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              onSubmit={(e) => { e.preventDefault(); setMatches(null); setShowForm(false) }}
            >
              <div className="mt-space-md grid gap-space-md border-t border-outline-variant/40 pt-space-md md:grid-cols-3">
                <Field label="I am">
                  <Select
                    value={query.ride_type}
                    onChange={(e) => setQuery({ ...query, ride_type: e.target.value })}
                  >
                    <option value="seek">Looking for a ride</option>
                    <option value="offer">Offering seats in my cab</option>
                  </Select>
                </Field>

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

                <Field label="Travel date">
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

                <Field label="Time flexibility" hint="wider = more matches">
                  <Select
                    value={query.time_flex}
                    onChange={(e) => setQuery({ ...query, time_flex: Number(e.target.value) })}
                  >
                    {(meta?.time_flex_options || []).map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="How many of you?">
                  <Select
                    value={query.group_size}
                    onChange={(e) => setQuery({ ...query, group_size: Number(e.target.value) })}
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>{n === 1 ? 'Just me' : `${n} of us`}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Luggage you're bringing">
                  <Select
                    value={query.luggage}
                    onChange={(e) => setQuery({ ...query, luggage: e.target.value })}
                  >
                    {(meta?.luggage_options || []).map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </Select>
                </Field>

                <div className="flex items-end">
                  <Button type="submit" className="w-full" icon="search">Update matches</Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* quick filters */}
        <div className="mt-space-md flex flex-wrap items-center gap-1.5 border-t border-outline-variant/40 pt-space-md">
          <span className="mr-1 inline-flex items-center gap-1 text-label-sm text-on-surface-variant">
            <Icon name="filter_alt" className="text-base" /> Quick filters
          </span>
          {FILTERS.map((f) => {
            const n = counts[f.id] ?? 0
            const active = filter === f.id
            if (n === 0 && f.id !== 'all') return null
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-space-md py-1 text-label-sm transition-colors ${
                  active
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {f.label} <span className="tnum opacity-75">({n})</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ══ results + sidebar ══ */}
      <div className="mt-space-lg grid gap-gutter-lg lg:grid-cols-[1fr_20rem]">
        <div className="space-y-gutter">
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {!loading && visible.length === 0 && (
            <EmptyState
              icon="search_off"
              title="No one going that way yet"
              body={`Nobody is leaving for ${query.to_location} around ${prettyTime(query.depart_time)}. Post your own trip and we'll alert verified students in your hostel who take off in the same window.`}
              action={
                <Button as="a" href="/post" icon="add_road">Post your own ride</Button>
              }
            />
          )}

          {!loading &&
            visible.map((m, i) => (
              <MatchCard
                key={m.ride.id}
                match={m}
                index={i}
                onJoin={join}
                joining={joiningId === m.ride.id}
              />
            ))}
        </div>

        {/* ══ sidebar ══ */}
        <aside className="space-y-gutter lg:sticky lg:top-20 lg:self-start">
          {/* savings */}
          <Card className="p-space-md">
            <SectionLabel icon="savings">Your split estimate</SectionLabel>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-body-sm text-on-surface-variant">Avg. solo fare</div>
                <div className="font-headline text-headline-sm tnum text-on-surface-variant line-through">
                  {money(soloFare)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-body-sm text-primary">Your RidePair share</div>
                <div className="font-headline text-headline-lg tnum text-primary">
                  ~{money(avgShare)}
                </div>
              </div>
            </div>
            <ProgressBar
              value={soloFare ? ((soloFare - avgShare) / soloFare) * 100 : 0}
              className="mt-space-sm"
            />
            <p className="mt-space-sm text-body-sm text-on-surface-variant">
              Best match on this board saves you{' '}
              <strong className="text-primary">{money(bestSaving)}</strong> versus riding alone.
            </p>
          </Card>

          {/* verification */}
          <Card className="p-space-md">
            <div className="flex items-center gap-1.5">
              <Icon name="verified_user" fill className="text-lg text-primary" />
              <h3 className="font-headline text-headline-sm text-on-surface">
                {meta?.college_short} verified only
              </h3>
            </div>
            <ul className="mt-space-sm space-y-space-sm text-body-sm text-on-surface-variant">
              {[
                `All ${matches?.length ?? 0} matches authenticated with an active @${meta?.email_domains?.[0]} credential.`,
                'Hostel block and branch shown on every host profile.',
                'Phone numbers unlock only after both sides confirm the match.',
              ].map((t) => (
                <li key={t} className="flex gap-1.5">
                  <Icon name="check_circle" fill className="text-base text-primary" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-space-md flex items-center gap-space-sm rounded-lg bg-primary-fixed/30 p-space-sm">
              <Icon name="emergency_share" className="text-lg text-primary" />
              <div className="text-body-sm text-on-primary-fixed-variant">
                <strong>Campus SafeRide sync</strong>
                <div>Share your live trip link with a hostel warden or friend.</div>
              </div>
            </div>
          </Card>

          {/* peak window */}
          <Card className="bg-secondary-fixed p-space-md">
            <SectionLabel icon="trending_up">Peak travel window</SectionLabel>
            <h3 className="font-headline text-headline-sm text-on-secondary-fixed">
              {prettyDate(query.ride_date)} evening rush
            </h3>
            <p className="mt-space-sm text-body-sm text-on-secondary-fixed-variant">
              <span className="tnum font-semibold">{matches?.length ?? 0}</span> students from your
              campus are leaving around {prettyTime(query.depart_time)}. Join an active pool or
              create your own.
            </p>
            <Button
              as="a"
              href="/post"
              variant="secondary"
              size="sm"
              icon="add"
              className="mt-space-md w-full"
            >
              Create a pool
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Summary({ icon, label, children }) {
  return (
    <div className="flex items-center gap-space-sm rounded-lg bg-surface-container-low px-space-md py-space-sm">
      <Icon name={icon} className="text-lg text-primary" />
      <div className="min-w-0">
        <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</div>
        <div className="truncate text-label-lg text-on-surface">{children}</div>
      </div>
    </div>
  )
}
