import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import {
  Avatar, Button, Card, Chip, ChoiceCard, Field, Icon, Input, Segmented, Select, Textarea, Toggle,
} from '../components/ui'
import RouteSpine from '../components/RouteSpine'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { useToast } from '../context/ToastContext'
import {
  HUB_ICON, HUB_LABEL, LUGGAGE_ICON, addMinutes, money, prettyDate, prettyTime, todayISO,
} from '../lib/format'

export default function PostRide() {
  const { meta } = useMeta()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    ride_type: 'offer',
    from_location: '',
    pickup_detail: '',
    to_location: '',
    drop_detail: '',
    ride_date: todayISO(),
    depart_time: '17:00',
    time_flex: 30,
    seats: 3,
    vehicle_type: 'xl',
    vehicle_info: '',
    luggage: 'carryon',
    fare_total: '',
    gender_only: false,
    notes: '',
  })

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (!meta) return
    setForm((f) => ({
      ...f,
      from_location: f.from_location || meta.pickup_points[0]?.name || '',
      pickup_detail: f.pickup_detail || meta.pickup_points[0]?.detail || '',
      to_location: f.to_location || meta.hubs[0]?.name || '',
      drop_detail: f.drop_detail || meta.hubs[0]?.detail || '',
    }))
  }, [meta])

  const hub = meta?.hubs?.find((h) => h.name === form.to_location)
  const isOffer = form.ride_type === 'offer'
  const vehicle = meta?.vehicle_types?.find((v) => v.id === form.vehicle_type)
  const maxSeats = isOffer ? vehicle?.max_seats || 6 : 3

  const fareTotal = Number(form.fare_total) || hub?.fare || 0
  const perHead = useMemo(() => {
    if (isOffer) return Math.round(fareTotal / (Number(form.seats) + 1))
    return Math.round(fareTotal / Math.max(1, Number(form.seats)))
  }, [fareTotal, form.seats, isOffer])

  // Picking a hub swaps in its default terminal detail.
  function pickHub(name) {
    const h = meta.hubs.find((x) => x.name === name)
    setForm((f) => ({ ...f, to_location: name, drop_detail: h?.detail || '' }))
  }
  function pickPickup(name) {
    const p = meta.pickup_points.find((x) => x.name === name)
    setForm((f) => ({ ...f, from_location: name, pickup_detail: p?.detail || '' }))
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const ride = await api.postRide({
        ride_type: form.ride_type,
        from_location: form.from_location,
        pickup_detail: form.pickup_detail || null,
        to_location: form.to_location,
        drop_detail: form.drop_detail || null,
        ride_date: form.ride_date,
        depart_time: form.depart_time,
        time_flex: Number(form.time_flex),
        seats: Number(form.seats),
        fare_total: fareTotal || null,
        fare_per_seat: isOffer ? perHead : null,
        vehicle_type: form.vehicle_type,
        vehicle_info: isOffer ? form.vehicle_info || null : null,
        luggage: form.luggage,
        gender_only: form.gender_only,
        notes: form.notes || null,
      })
      toast('Ride published — finding your matches now 🚀', 'success')
      const params = new URLSearchParams({
        from_location: ride.from_location,
        to_location: ride.to_location,
        ride_date: ride.ride_date,
        depart_time: ride.depart_time,
      })
      navigate(`/find?${params}`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  // Group hubs by category for the "popular transit hubs" picker.
  const hubsByCategory = useMemo(() => {
    const groups = {}
    for (const h of meta?.hubs || []) (groups[h.category] ||= []).push(h)
    return groups
  }, [meta])

  return (
    <form onSubmit={submit} className="mx-auto max-w-[1200px] px-margin py-space-lg md:px-margin-md">
      <div className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <Chip tone="primary" icon="hub">Verified student carpool &amp; cab splitter</Chip>
          <h1 className="mt-space-sm font-headline text-headline-lg text-on-surface">
            Post a ride &amp; split fares
          </h1>
          <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
            Going to the airport, railway station or heading home for the break? Post your trip and
            let verified campus mates join.
          </p>
        </div>

        <Card className="flex items-center gap-space-sm p-space-md">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-fixed/50 text-primary">
            <Icon name="bolt" fill className="text-lg" />
          </span>
          <div>
            <div className="font-headline text-headline-sm tnum text-on-surface">~4 mins</div>
            <div className="text-body-sm text-on-surface-variant">Avg. campus match time</div>
          </div>
        </Card>
      </div>

      <div className="mt-space-lg grid gap-gutter-lg lg:grid-cols-[1fr_22rem]">
        {/* ══════════ form steps ══════════ */}
        <div className="space-y-gutter">

          {/* ───── step 1 ───── */}
          <Step n={1} title="Route & destination" of={3}>
            <Field label="Starting point (campus origin)">
              <Select value={form.from_location} onChange={(e) => pickPickup(e.target.value)}>
                {(meta?.pickup_points || []).map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </Select>
            </Field>
            {form.pickup_detail && (
              <p className="-mt-1 border-l-2 border-primary/40 pl-space-sm text-body-sm text-on-surface-variant">
                {form.pickup_detail}
              </p>
            )}

            <div>
              <div className="mb-space-sm flex items-center gap-1.5 text-label-md text-on-surface">
                <Icon name="explore" className="text-base text-primary" />
                Popular transit hubs
              </div>
              <div className="grid gap-space-sm sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(hubsByCategory).map(([category, list]) => {
                  const active = list.some((h) => h.name === form.to_location)
                  return (
                    <ChoiceCard
                      key={category}
                      active={active}
                      icon={HUB_ICON[category]}
                      title={HUB_LABEL[category]}
                      detail={list.map((h) => h.name.split('(')[0].trim()).join(' · ')}
                      onClick={() => pickHub(list[0].name)}
                    />
                  )
                })}
              </div>
            </div>

            <Field label="Exact hub" hint={hub ? `approx ${money(hub.fare)} total` : undefined}>
              <Select value={form.to_location} onChange={(e) => pickHub(e.target.value)}>
                {(meta?.hubs || []).map((h) => (
                  <option key={h.name} value={h.name}>{h.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Specific drop point / terminal" hint="e.g. Platform 1, Terminal 3">
              <Input
                value={form.drop_detail}
                onChange={(e) => set('drop_detail', e.target.value)}
                placeholder="Platform 1 entry, main porch"
              />
            </Field>
          </Step>

          {/* ───── step 2 ───── */}
          <Step n={2} title="Date & time window" of={3}>
            <div className="grid gap-space-md sm:grid-cols-2">
              <Field label="Travel date">
                <Input
                  type="date"
                  value={form.ride_date}
                  min={todayISO()}
                  onChange={(e) => set('ride_date', e.target.value)}
                  required
                />
              </Field>
              <Field label="Preferred departure time">
                <Input
                  type="time"
                  value={form.depart_time}
                  onChange={(e) => set('depart_time', e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field label="Time flexibility" hint="wider windows find more co-riders">
              <Segmented
                value={Number(form.time_flex)}
                onChange={(v) => set('time_flex', v)}
                options={(meta?.time_flex_options || []).map((o) => ({
                  value: o.id,
                  label: o.label,
                  sub: o.recommended ? 'recommended' : undefined,
                }))}
              />
            </Field>
          </Step>

          {/* ───── step 3 ───── */}
          <Step n={3} title="Vehicle, luggage & preferences" of={3}>
            <Field label="Are you offering seats, or looking to share?">
              <div className="grid gap-space-sm sm:grid-cols-2">
                <ChoiceCard
                  active={isOffer}
                  icon="directions_car"
                  title="Offer a ride"
                  detail="You have (or will book) a cab with free seats"
                  onClick={() => set('ride_type', 'offer')}
                />
                <ChoiceCard
                  active={!isOffer}
                  icon="group_add"
                  title="Looking to share"
                  detail="You need a cab and want people to split with"
                  onClick={() => set('ride_type', 'seek')}
                />
              </div>
            </Field>

            {isOffer && (
              <Field label="Ride type & vehicle size">
                <div className="grid gap-space-sm sm:grid-cols-3">
                  {(meta?.vehicle_types || []).map((v) => (
                    <ChoiceCard
                      key={v.id}
                      active={form.vehicle_type === v.id}
                      icon="local_taxi"
                      title={v.label}
                      detail={v.detail}
                      onClick={() => {
                        set('vehicle_type', v.id)
                        set('seats', Math.min(Number(form.seats), v.max_seats))
                      }}
                    />
                  ))}
                </div>
              </Field>
            )}

            <div className="grid gap-space-md sm:grid-cols-2">
              {/* seat stepper */}
              <Field label={isOffer ? 'Available seats to share' : 'How many of you are travelling?'}>
                <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-sm">
                  <StepBtn
                    icon="remove"
                    onClick={() => set('seats', Math.max(1, Number(form.seats) - 1))}
                  />
                  <div className="text-center">
                    <div className="font-headline text-headline-lg tnum text-primary">{form.seats}</div>
                    <div className="text-label-sm text-on-surface-variant">
                      {isOffer ? 'seats (excluding you)' : 'travelling'}
                    </div>
                  </div>
                  <StepBtn
                    icon="add"
                    onClick={() => set('seats', Math.min(maxSeats, Number(form.seats) + 1))}
                  />
                </div>
              </Field>

              {/* luggage */}
              <Field label="Luggage per person" hint="prevents boot overflow">
                <div className="space-y-space-sm">
                  {(meta?.luggage_options || []).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => set('luggage', o.id)}
                      className={`flex w-full items-center gap-space-sm rounded-lg border px-space-sm py-2 text-left transition-colors ${
                        form.luggage === o.id
                          ? 'border-primary bg-primary-fixed/20'
                          : 'border-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    >
                      <span
                        className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                          form.luggage === o.id ? 'border-primary' : 'border-outline'
                        }`}
                      >
                        {form.luggage === o.id && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </span>
                      <Icon name={LUGGAGE_ICON[o.id]} className="text-base text-on-surface-variant" />
                      <span className="text-body-md text-on-surface">{o.label}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {isOffer && (
              <Field label="Vehicle details" hint="optional, builds trust">
                <Input
                  value={form.vehicle_info}
                  onChange={(e) => set('vehicle_info', e.target.value)}
                  placeholder="Innova Crysta — PB10 AB 1234"
                />
              </Field>
            )}

            <Field
              label={`Estimated total cab fare (${meta?.currency || '₹'})`}
              hint="check your cab app estimate"
            >
              <Input
                type="number"
                min={0}
                step={10}
                value={form.fare_total}
                onChange={(e) => set('fare_total', e.target.value)}
                placeholder={String(hub?.fare || 700)}
              />
              <p className="mt-1 flex items-center gap-1.5 text-body-sm text-primary">
                <Icon name="savings" className="text-base" />
                Approx {money(perHead)} per person with{' '}
                {isOffer ? Number(form.seats) + 1 : form.seats} students sharing.
              </p>
            </Field>

            <Toggle
              checked={form.gender_only}
              onChange={(v) => set('gender_only', v)}
              label="Same-gender co-riders only"
              detail="Allow only verified students of your own gender to join this specific split."
            />

            <Field label="Pickup landmark & notes" hint="optional">
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                maxLength={400}
                placeholder="Will book the cab at 4:55 PM sharp outside the Uni Mall archway. Bring exact UPI change!"
              />
            </Field>
          </Step>
        </div>

        {/* ══════════ live preview sidebar ══════════ */}
        <aside className="space-y-gutter lg:sticky lg:top-20 lg:self-start">
          <div>
            <div className="mb-space-sm flex items-center justify-between">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                Live student feed preview
              </span>
              <span className="inline-flex items-center gap-1 text-label-sm text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Real-time sync
              </span>
            </div>

            <Card className="overflow-hidden p-space-md">
              <div className="flex items-center gap-space-sm">
                <Avatar name={user?.name} size="sm" verified />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-label-lg text-on-surface">{user?.name}</div>
                  <div className="truncate text-body-sm text-on-surface-variant">
                    {isOffer ? 'Trip host' : 'Looking to share'}
                    {user?.class_year ? ` · ’${String(user.class_year).slice(-2)}` : ''}
                  </div>
                </div>
                <Chip tone="primary" icon="bolt">High match</Chip>
              </div>

              <div className="mt-space-md rounded-xl bg-surface-container-low p-space-md">
                <RouteSpine
                  from={form.from_location}
                  fromDetail={`${prettyDate(form.ride_date)} · ${prettyTime(form.depart_time)} (±${form.time_flex}m)`}
                  to={form.to_location}
                  toDetail={form.drop_detail}
                  toTime={hub ? addMinutes(form.depart_time, hub.minutes) : undefined}
                  category={hub?.category}
                  compact
                />
              </div>

              <div className="mt-space-sm grid grid-cols-3 gap-space-sm text-center">
                <MiniStat label="Open seats" value={isOffer ? form.seats : maxSeats - form.seats} />
                <MiniStat
                  label="Luggage"
                  value={<Icon name={LUGGAGE_ICON[form.luggage]} className="text-lg text-secondary" />}
                />
                <MiniStat label="You pay" value={`~${money(perHead)}`} highlight />
              </div>

              {form.notes && (
                <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-sm text-body-sm italic text-on-surface-variant">
                  “{form.notes}”
                </p>
              )}

              <div className="mt-space-sm rounded-lg bg-secondary-fixed py-1.5 text-center text-label-sm text-on-secondary-fixed">
                Others see: [ Request to join split ]
              </div>
            </Card>
          </div>

          <Card className="p-space-md">
            <div className="flex items-center gap-1.5">
              <Icon name="shield" fill className="text-lg text-primary" />
              <h3 className="font-headline text-headline-sm text-on-surface">
                Safe {meta?.college_short} mobility network
              </h3>
            </div>
            <p className="mt-space-sm text-body-sm text-on-surface-variant">
              Every rider logs in with an active campus credential. Co-riders exchange numbers only
              after the match is accepted.
            </p>
            <div className="mt-space-sm flex flex-wrap gap-1.5">
              <Chip tone="neutral" icon="chat">In-app coordination</Chip>
              <Chip tone="neutral" icon="percent">Zero markup</Chip>
              <Chip tone="neutral" icon="account_balance_wallet">Direct UPI split</Chip>
            </div>
          </Card>

          {hub && (
            <Card className="p-space-md">
              <div className="flex items-center justify-between">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Transit corridor
                </span>
                <span className="text-label-sm tnum text-on-surface-variant">
                  ~{hub.minutes} min
                </span>
              </div>
              <div className="mt-space-sm rounded-xl bg-secondary-fixed/60 p-space-lg text-center">
                <Icon name="alt_route" className="text-2xl text-secondary" />
                <div className="mt-1 text-label-md text-on-secondary-fixed">
                  Campus → {hub.name.split('(')[0].trim()}
                </div>
                <div className="text-body-sm text-on-secondary-fixed-variant">
                  arrives ~{prettyTime(addMinutes(form.depart_time, hub.minutes))}
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>

      {/* ══════════ publish bar ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-0 z-40 mt-gutter-lg"
      >
        <Card className="flex flex-wrap items-center gap-space-md p-space-md shadow-e3">
          <Button type="button" variant="ghost" onClick={() => navigate('/find')}>
            Discard draft
          </Button>
          <span className="hidden items-center gap-1.5 text-body-sm text-on-surface-variant sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Visible to every verified {meta?.college_short} student
          </span>
          <Button type="submit" size="lg" loading={busy} icon="rocket_launch" className="ml-auto">
            Publish ride &amp; find matches
          </Button>
        </Card>
      </motion.div>
    </form>
  )
}

/* ─────────── helpers ─────────── */
function Step({ n, title, of, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="p-space-md sm:p-space-lg">
        <div className="mb-space-md flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-headline text-label-lg text-on-primary">
              {n}
            </span>
            <h2 className="font-headline text-headline-md text-on-surface">{title}</h2>
          </div>
          <Chip tone="neutral">Step {n} of {of}</Chip>
        </div>
        <div className="space-y-space-md">{children}</div>
      </Card>
    </motion.div>
  )
}

function StepBtn({ icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-lg bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
    >
      <Icon name={icon} className="text-lg" />
    </button>
  )
}

function MiniStat({ label, value, highlight }) {
  return (
    <div className="rounded-lg bg-surface-container-low px-space-sm py-1.5">
      <div className="text-label-sm text-on-surface-variant">{label}</div>
      <div
        className={`text-label-lg tnum ${highlight ? 'text-primary' : 'text-on-surface'}`}
      >
        {value}
      </div>
    </div>
  )
}
