import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'

import {
  Avatar, Button, Card, Chip, HubChip, Icon, MatchChip, ProgressBar, SectionLabel, Spinner,
} from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { useToast } from '../context/ToastContext'
import {
  LUGGAGE_ICON, LUGGAGE_LABEL, VEHICLE_LABEL,
  addMinutes, departsIn, duration, money, prettyDate, prettyTime,
} from '../lib/format'

export default function RideDetails() {
  const { id } = useParams()
  const { meta } = useMeta()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [ride, setRide] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .getRide(id)
      .then((r) => { if (!cancelled) setRide(r) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [id])

  async function join() {
    setBusy(true)
    try {
      const updated = await api.join(ride.id)
      setRide(updated)
      toast('Seat confirmed! Contact details are now unlocked. 🎉', 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-margin py-space-2xl text-center">
        <h1 className="font-headline text-headline-lg text-error">{error}</h1>
        <Button as={Link} to="/find" className="mt-space-md" icon="arrow_back">
          Back to matches
        </Button>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="grid place-items-center py-space-2xl text-primary">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const onRide = ride.is_mine || ride.has_joined
  const arrival = addMinutes(ride.depart_time, ride.est_duration_min)
  const capacity = ride.ride_type === 'offer' ? ride.seats_total + 1 : meta?.max_group_size || 4
  const openSeats = Math.max(0, capacity - ride.riders_count)
  const roster = [
    { ...ride.creator, is_host: true },
    ...ride.riders.map((r) => ({ ...r, is_host: false })),
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-margin py-space-lg md:px-margin-md">
      {/* ══ breadcrumb ══ */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-label-lg text-on-surface-variant transition-colors hover:text-primary"
        >
          <Icon name="arrow_back" className="text-lg" />
          Back to matched rides
        </button>
        <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
          Ride ID{' '}
          <span className="ml-1 rounded-full bg-surface-container-high px-space-sm py-0.5 tnum text-on-surface">
            #{ride.ride_code}
          </span>
        </span>
      </div>

      {/* ══ hero ══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="mt-space-md p-space-lg">
          <div className="flex flex-wrap items-start justify-between gap-space-lg">
            <div className="min-w-[16rem] flex-1">
              <div className="flex flex-wrap gap-1.5">
                <HubChip category={ride.hub_category} />
                <Chip tone="secondary" icon="schedule">
                  Departs {departsIn(ride.ride_date, ride.depart_time)}
                </Chip>
                {ride.gender_only && (
                  <Chip tone="primary" icon="shield_person">Same-gender only</Chip>
                )}
                {ride.status === 'full' && <Chip tone="error" icon="block">Full</Chip>}
              </div>

              <h1 className="mt-space-md font-headline text-headline-lg text-on-surface md:text-display-lg">
                {ride.from_location}{' '}
                <Icon name="arrow_forward" className="align-middle text-primary" />{' '}
                {ride.to_location}
              </h1>
              <p className="mt-space-sm flex flex-wrap items-center gap-x-space-md gap-y-1 text-body-md text-on-surface-variant">
                {ride.drop_detail && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="place" className="text-base" />
                    {ride.drop_detail}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="event" className="text-base" />
                  {prettyDate(ride.ride_date)}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-space-sm">
              <HeroStat label="Seats open" value={openSeats} sub={`of ${capacity}`} highlight />
              <HeroStat label="Target departure" value={prettyTime(ride.depart_time)} sub={`±${ride.time_flex}m`} />
              <HeroStat label="Est. ride time" value={duration(ride.est_duration_min)} sub={`arr. ${prettyTime(arrival)}`} />
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="mt-space-lg grid gap-gutter-lg lg:grid-cols-[1fr_22rem]">
        {/* ══════════ left column ══════════ */}
        <div className="space-y-gutter">

          {/* host */}
          <Card className="p-space-lg">
            <div className="flex flex-wrap items-center gap-space-md">
              <Avatar name={ride.creator.name} size="lg" verified />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <h2 className="font-headline text-headline-md text-on-surface">
                    {ride.creator.name}
                  </h2>
                  <Chip tone="primary" icon="verified">
                    {meta?.college_short} verified
                  </Chip>
                  <Chip tone="neutral">
                    {ride.ride_type === 'offer' ? 'Ride host' : 'Group starter'}
                  </Chip>
                </div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  {[ride.creator.major, ride.creator.class_year && `Class of ${ride.creator.class_year}`]
                    .filter(Boolean)
                    .join(' · ')}
                  {' · '}
                  {ride.creator.rides_hosted} verified campus rides completed
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-space-md py-space-sm">
                <Icon name="star" fill className="text-lg text-warning" />
                <span className="font-headline text-headline-sm tnum text-on-surface">
                  {ride.creator.rating?.toFixed(1)}
                </span>
              </div>
            </div>

            {ride.notes && (
              <div className="mt-space-md rounded-xl bg-secondary-fixed/50 p-space-md">
                <SectionLabel icon="chat">Note from {ride.creator.name.split(' ')[0]}</SectionLabel>
                <p className="text-body-md italic text-on-secondary-fixed">“{ride.notes}”</p>
              </div>
            )}
          </Card>

          {/* timeline */}
          <Card className="p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Route timeline &amp; waypoints
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Optimised pickup spot with pedestrian access
                </p>
              </div>
              <Chip tone="tertiary" icon="traffic">Traffic: light</Chip>
            </div>

            <div className="mt-space-md space-y-space-md">
              <Waypoint
                time={ride.depart_time}
                tag="Pickup spot"
                tone="primary"
                title={ride.from_location}
                detail={ride.pickup_detail}
                side="Campus"
              />
              <div className="flex items-center gap-space-sm pl-space-lg text-body-sm text-secondary">
                <Icon name="alt_route" className="text-base" />
                Corridor transit · approx {duration(ride.est_duration_min)} ·{' '}
                {VEHICLE_LABEL[ride.vehicle_type] || 'Cab'}
              </div>
              <Waypoint
                time={arrival}
                tag="Final drop-off"
                tone="secondary"
                title={ride.to_location}
                detail={ride.drop_detail}
                side="Destination"
              />
            </div>
          </Card>

          {/* roster */}
          <Card className="p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Vehicle roster &amp; passenger capacity
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  {capacity} total seats in the {VEHICLE_LABEL[ride.vehicle_type] || 'cab'}
                </p>
              </div>
              <Chip tone="primary" icon="group">
                {ride.riders_count} claimed · {openSeats} open
              </Chip>
            </div>

            <div className="mt-space-md grid gap-space-sm sm:grid-cols-2">
              {roster.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-md"
                >
                  <Avatar name={person.name} size="md" verified />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-label-lg text-on-surface">
                        {person.name}
                        {person.id === user?.id && ' (You)'}
                      </span>
                      <Chip tone={person.is_host ? 'primary' : 'neutral'}>
                        {person.is_host ? 'Host' : 'Passenger'}
                      </Chip>
                    </div>
                    <div className="truncate text-body-sm text-on-surface-variant">
                      {[person.major, person.class_year && `’${String(person.class_year).slice(-2)}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {person.phone && (
                      <a
                        href={`tel:${person.phone}`}
                        className="mt-0.5 inline-flex items-center gap-1 text-body-sm text-primary hover:underline"
                      >
                        <Icon name="call" className="text-[0.9rem]" />
                        {person.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {Array.from({ length: openSeats }, (_, i) => (
                <div
                  key={`open-${i}`}
                  className={`flex items-center gap-space-sm rounded-xl border border-dashed p-space-md ${
                    i === 0 && !onRide
                      ? 'border-primary bg-primary-fixed/20'
                      : 'border-outline-variant'
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full text-label-md ${
                      i === 0 && !onRide
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    #{ride.riders_count + i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-label-lg text-on-surface">
                      Available seat {ride.riders_count + i + 1}
                    </div>
                    <div className="text-body-sm text-on-surface-variant">
                      {i === 0 && !onRide ? 'Ready for your confirmation' : 'Open for matching students'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* guidelines */}
          <Card className="p-space-lg">
            <h2 className="font-headline text-headline-md text-on-surface">
              Ride guidelines &amp; split logistics
            </h2>
            <div className="mt-space-md grid gap-space-sm sm:grid-cols-3">
              {[
                {
                  icon: 'schedule', tone: 'primary', title: 'Booking time',
                  body: `${ride.creator.name.split(' ')[0]} books the cab at ${prettyTime(ride.depart_time)} sharp, with a ±${ride.time_flex} minute window for co-riders.`,
                },
                {
                  icon: 'account_balance_wallet', tone: 'secondary', title: 'Zero-fee split',
                  body: 'Direct UPI, cash or wallet split at pickup. RidePair takes no platform fee or markup.',
                },
                {
                  icon: LUGGAGE_ICON[ride.luggage] || 'luggage', tone: 'tertiary', title: 'Luggage capacity',
                  body: `${LUGGAGE_LABEL[ride.luggage]} per person. Confirm with the host before adding extra bags.`,
                },
              ].map((g) => (
                <div key={g.title} className="rounded-xl bg-surface-container-low p-space-md">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg ${
                      { primary: 'bg-primary-fixed/50 text-primary',
                        secondary: 'bg-secondary-fixed text-secondary',
                        tertiary: 'bg-tertiary-fixed text-tertiary' }[g.tone]
                    }`}
                  >
                    <Icon name={g.icon} className="text-lg" />
                  </span>
                  <h3 className="mt-space-sm text-label-lg text-on-surface">{g.title}</h3>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{g.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ══════════ right column ══════════ */}
        <aside className="space-y-gutter lg:sticky lg:top-20 lg:self-start">
          <Card className="p-space-lg">
            <div className="flex items-baseline justify-between">
              <SectionLabel>Your est. share</SectionLabel>
              <span className="text-label-sm text-on-surface-variant">
                Total {money(ride.fare_total)}
              </span>
            </div>
            <div className="font-headline text-[2.5rem] leading-none tnum text-primary">
              {money(ride.fare_per_seat)}
              <span className="ml-1 text-body-md font-normal text-on-surface-variant">/ student</span>
            </div>

            {ride.solo_fare > ride.fare_per_seat && (
              <div className="mt-space-md flex gap-space-sm rounded-xl bg-primary-fixed/30 p-space-sm">
                <Icon name="savings" fill className="text-lg text-primary" />
                <p className="text-body-sm text-on-primary-fixed-variant">
                  Saves you <strong>{money(ride.solo_fare - ride.fare_per_seat)}</strong> compared
                  with riding solo ({money(ride.solo_fare)}).
                </p>
              </div>
            )}

            <dl className="mt-space-md space-y-space-sm border-t border-outline-variant/40 pt-space-md text-body-sm">
              <Row label="Estimated cab total" value={money(ride.fare_total)} />
              <Row label="Planned party size" value={`${ride.riders_count} verified students`} />
              <Row label="Luggage clearance" value={LUGGAGE_LABEL[ride.luggage]} />
              <Row label="RidePair service fee" value={`${money(0)} (free)`} tone="primary" />
            </dl>

            <div className="mt-space-md">
              <div className="mb-1 flex items-center justify-between text-label-sm text-on-surface-variant">
                <span>Roster status</span>
                <span className="tnum">{Math.round((ride.riders_count / capacity) * 100)}% filled</span>
              </div>
              <ProgressBar value={(ride.riders_count / capacity) * 100} />
            </div>

            <div className="mt-space-md space-y-space-sm">
              {onRide ? (
                <div className="rounded-xl bg-primary-fixed/30 p-space-md text-center">
                  <Icon name="check_circle" fill className="text-2xl text-primary" />
                  <p className="mt-1 text-label-lg text-on-primary-fixed-variant">
                    {ride.is_mine ? 'This is your ride' : "You're on this ride"}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    Co-rider contact details are unlocked above.
                  </p>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  icon="person_add"
                  loading={busy}
                  onClick={join}
                  disabled={ride.status !== 'open' || openSeats === 0}
                >
                  {ride.status === 'open' ? 'Request to join ride' : 'Ride is full'}
                </Button>
              )}

              <Button
                as={Link}
                to="/find"
                variant="outline"
                className="w-full"
                icon="search"
              >
                Browse other matches
              </Button>
            </div>

            <ul className="mt-space-md space-y-space-sm text-body-sm text-on-surface-variant">
              {[
                `Verified @${meta?.email_domains?.[0]} single sign-on`,
                'Contact details shared only after both sides confirm',
                'Free cancellation up to 3 hours prior',
              ].map((t) => (
                <li key={t} className="flex gap-1.5">
                  <Icon name="check_circle" fill className="text-base text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-primary-fixed/25 p-space-md">
            <div className="flex gap-space-sm">
              <Icon name="health_and_safety" fill className="text-xl text-primary" />
              <div>
                <h3 className="text-label-lg text-on-primary-fixed-variant">
                  RidePair SafeRide guarantee
                </h3>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Share your live trip details with a hostel warden or friend the moment the cab is
                  booked.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

/* ─────────── helpers ─────────── */
function HeroStat({ label, value, sub, highlight }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-space-md py-space-sm text-center">
      <div className="text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div
        className={`font-headline text-headline-md tnum ${highlight ? 'text-primary' : 'text-on-surface'}`}
      >
        {value}
      </div>
      {sub && <div className="text-label-sm text-on-surface-variant">{sub}</div>}
    </div>
  )
}

function Waypoint({ time, tag, tone, title, detail, side }) {
  return (
    <div className="flex gap-space-md">
      <div className="flex flex-col items-center pt-1.5">
        <span
          className={`h-3 w-3 rounded-full ${tone === 'primary' ? 'bg-primary' : 'bg-secondary'}`}
        />
      </div>
      <div className="flex-1 rounded-xl bg-surface-container-low p-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="font-headline text-headline-sm tnum text-primary">
              {prettyTime(time)}
            </span>
            <Chip tone={tone === 'primary' ? 'primary' : 'secondary'}>{tag}</Chip>
          </div>
          <span className="text-label-sm text-on-surface-variant">{side}</span>
        </div>
        <div className="mt-1 text-label-lg text-on-surface">{title}</div>
        {detail && <div className="text-body-sm text-on-surface-variant">{detail}</div>}
      </div>
    </div>
  )
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-space-sm">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={`tnum text-right ${tone === 'primary' ? 'text-primary' : 'text-on-surface'}`}>
        {value}
      </dd>
    </div>
  )
}
