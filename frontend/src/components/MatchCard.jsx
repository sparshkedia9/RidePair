/* The signature ride listing card.

   Header (host + trust signals + match %) → route spine → metadata tray
   (luggage, seats, fare split) → footer action, exactly as the spec lays out.
   The collapsible "How we scored this" panel is what turns a ranked list
   into something a judge can audit. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import {
  Avatar, Button, Card, Chip, Icon, MatchChip, SeatChip, SeatDots,
} from './ui'
import RouteSpine from './RouteSpine'
import { useMeta } from '../context/MetaContext'
import {
  LUGGAGE_ICON, LUGGAGE_LABEL, MATCH_KIND, VEHICLE_LABEL,
  addMinutes, money, prettyDate,
} from '../lib/format'

export default function MatchCard({ match, index = 0, onJoin, joining = false }) {
  const { meta } = useMeta()
  const [showWhy, setShowWhy] = useState(false)
  const r = match.ride
  const kind = MATCH_KIND[match.match_kind] || MATCH_KIND.group_up
  const weights = meta?.weights || {}
  const isTop = index === 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.07, 0.35), ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {isTop && (
        <span className="absolute -top-2 left-space-lg z-10 rounded-full bg-primary px-space-sm py-0.5 text-label-sm text-on-primary shadow-e1">
          Top match
        </span>
      )}

      <Card hover className={`overflow-hidden ${isTop ? 'ring-2 ring-primary/35' : ''}`}>
        {/* accent rail on the best match */}
        {isTop && <span className="absolute inset-y-0 left-0 w-1 bg-primary" />}

        <div className="p-space-md sm:p-space-lg">
          {/* ══ header ══ */}
          <div className="flex items-start gap-space-sm">
            <Avatar name={r.creator.name} size="md" verified />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
                <span className="truncate font-headline text-headline-sm text-on-surface">
                  {r.creator.name}
                </span>
                {r.creator.class_year && (
                  <Chip tone="secondary">
                    {r.creator.major?.split(' ')[0]} &apos;{String(r.creator.class_year).slice(-2)}
                  </Chip>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-space-sm text-body-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <Icon name="star" fill className="text-[0.9rem] text-warning" />
                  <span className="tnum">{r.creator.rating?.toFixed(1)}</span>
                </span>
                <span>{r.creator.rides_hosted} rides hosted</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <Icon name="verified" fill className="text-[0.9rem]" />
                  Verified
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <MatchChip score={match.score} />
              <span className="text-label-sm text-on-surface-variant">
                {match.time_gap_minutes === 0
                  ? 'exact time'
                  : `${match.time_gap_minutes} min apart`}
              </span>
            </div>
          </div>

          {/* ══ route ══ */}
          <div className="mt-space-md rounded-xl bg-surface-container-low p-space-md">
            <RouteSpine
              from={r.from_location}
              fromDetail={r.pickup_detail}
              fromTime={r.depart_time}
              to={r.to_location}
              toDetail={r.drop_detail}
              toTime={addMinutes(r.depart_time, r.est_duration_min)}
              category={r.hub_category}
              compact
            />
          </div>

          {/* ══ metadata tray ══ */}
          <div className="mt-space-sm grid grid-cols-2 gap-space-sm sm:grid-cols-3">
            <Tray label="Seats available">
              <SeatDots
                filled={r.riders_count}
                total={r.ride_type === 'offer' ? r.seats_total + 1 : meta?.max_group_size || 4}
              />
              <span className="ml-1 text-label-md tnum text-on-surface">
                {r.seats_available} left
              </span>
            </Tray>

            <Tray label="Luggage room">
              <Icon name={LUGGAGE_ICON[r.luggage] || 'luggage'} className="text-base text-secondary" />
              <span className="truncate text-label-md text-on-surface">
                {LUGGAGE_LABEL[r.luggage] || 'Standard'}
              </span>
            </Tray>

            <Tray label="Est. share" className="col-span-2 sm:col-span-1">
              <span className="font-headline text-headline-sm tnum text-primary">
                {money(match.your_share)}
              </span>
              <span className="text-body-sm text-on-surface-variant">/ rider</span>
            </Tray>
          </div>

          {/* ══ reason chips ══ */}
          <div className="mt-space-sm flex flex-wrap gap-1.5">
            <Chip tone="primary" icon={kind.icon}>{kind.label}</Chip>
            <Chip tone="neutral" icon="event">{prettyDate(r.ride_date)}</Chip>
            {r.gender_only && (
              <Chip tone="secondary" icon="shield_person">Same-gender only</Chip>
            )}
            {r.vehicle_type && (
              <Chip tone="neutral" icon="local_taxi">{VEHICLE_LABEL[r.vehicle_type]}</Chip>
            )}
            {match.you_save > 0 && (
              <Chip tone="primary" icon="savings">
                Saves {money(match.you_save)} ({match.save_pct}%)
              </Chip>
            )}
          </div>

          {r.notes && (
            <p className="mt-space-sm rounded-lg bg-surface-container-low p-space-sm text-body-sm italic text-on-surface-variant">
              “{r.notes}”
            </p>
          )}

          {/* ══ scoring transparency ══ */}
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="mt-space-sm flex items-center gap-1 text-label-md text-secondary hover:underline"
          >
            <Icon name="query_stats" className="text-base" />
            How we scored this
            <Icon
              name="expand_more"
              className={`text-base transition-transform ${showWhy ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {showWhy && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-space-sm space-y-space-sm rounded-xl bg-surface-container-low p-space-md">
                  {Object.entries(match.breakdown).map(([label, value]) => {
                    const max = weights[label] || 50
                    return (
                      <div key={label} className="flex items-center gap-space-sm">
                        <span className="w-20 shrink-0 text-label-sm capitalize text-on-surface-variant">
                          {label}
                        </span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / max) * 100}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="block h-full rounded-full bg-primary"
                          />
                        </span>
                        <span className="w-12 shrink-0 text-right text-label-sm tnum text-on-surface">
                          {value}/{max}
                        </span>
                      </div>
                    )
                  })}
                  <ul className="space-y-1 pt-1">
                    {match.reasons.map((reason) => (
                      <li key={reason} className="flex gap-1.5 text-body-sm text-on-surface-variant">
                        <Icon name="check_circle" fill className="text-[0.95rem] text-primary" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ footer ══ */}
          <div className="mt-space-md flex flex-wrap items-center gap-space-sm border-t border-outline-variant/40 pt-space-md">
            <div className="mr-auto">
              <div className="text-label-sm text-on-surface-variant">Total cab approx.</div>
              <div className="text-label-lg tnum text-on-surface">
                {money(r.fare_total)}{' '}
                <span className="font-normal text-on-surface-variant line-through">
                  {money(r.solo_fare)} solo
                </span>
              </div>
            </div>

            <Button as={Link} to={`/ride/${r.id}`} variant="outline" size="sm" icon="info">
              Details
            </Button>
            <Button
              size="sm"
              icon="person_add"
              loading={joining}
              onClick={() => onJoin?.(r.id)}
            >
              Request to Join
            </Button>
          </div>
        </div>
      </Card>
    </motion.article>
  )
}

function Tray({ label, children, className = '' }) {
  return (
    <div className={`rounded-lg bg-surface-container-low px-space-sm py-1.5 ${className}`}>
      <div className="text-label-sm text-on-surface-variant">{label}</div>
      <div className="mt-0.5 flex min-w-0 items-center gap-1">{children}</div>
    </div>
  )
}
