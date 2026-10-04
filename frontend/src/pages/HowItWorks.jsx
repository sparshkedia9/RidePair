import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Button, Card, Chip, Icon } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { money } from '../lib/format'

export default function HowItWorks() {
  const { meta } = useMeta()
  const { isLoggedIn } = useAuth()
  const weights = meta?.weights || {}

  const WEIGHT_ROWS = [
    { key: 'time', label: 'Departure proximity', body: 'How close their departure is to yours, scaled by whichever side is more flexible.' },
    { key: 'destination', label: 'Destination match', body: 'Exact hub and terminal, with a shared-vocabulary fallback for custom stops.' },
    { key: 'pickup', label: 'Pickup proximity', body: 'Same campus gate scores full marks; a different gate still scores half.' },
    { key: 'seats', label: 'Seat fit', body: 'Whether your whole group physically fits in the remaining seats.' },
    { key: 'luggage', label: 'Luggage fit', body: 'Whether the boot has room for the bags you said you are bringing.' },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-margin py-space-lg md:px-margin-md">
      <div className="max-w-3xl">
        <Chip tone="secondary" icon="school">How RidePair works</Chip>
        <h1 className="mt-space-sm font-headline text-headline-lg text-on-surface md:text-display-lg">
          Ranked, not just filtered.
        </h1>
        <p className="mt-space-md text-body-lg text-on-surface-variant">
          Most ride boards show you a list. RidePair scores every candidate out of 100 and explains
          every point it awarded — so you can see exactly why the top match is on top.
        </p>
      </div>

      {/* ══ the three match types ══ */}
      <section className="mt-space-xl">
        <h2 className="font-headline text-headline-md text-on-surface">
          One engine, three kinds of match
        </h2>
        <div className="mt-space-md grid gap-gutter md:grid-cols-3">
          {[
            { icon: 'directions_car', tone: 'primary', title: 'Join a cab',
              body: 'You need a ride, a classmate already has a cab with free seats. You take one and pay their per-seat rate.' },
            { icon: 'group_add', tone: 'secondary', title: 'Group up',
              body: 'You need a ride and so does someone else — neither of you has a car. RidePair pairs you so you split one cab.',
              highlight: true },
            { icon: 'front_hand', tone: 'tertiary', title: 'Fill your seats',
              body: 'You are hosting a cab. RidePair surfaces verified students who need exactly the seat you have spare.' },
          ].map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <Card
                hover
                className={`h-full p-space-md ${m.highlight ? 'ring-2 ring-primary/35' : ''}`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl ${
                    { primary: 'bg-primary-fixed/50 text-primary',
                      secondary: 'bg-secondary-fixed text-secondary',
                      tertiary: 'bg-tertiary-fixed text-tertiary' }[m.tone]
                  }`}
                >
                  <Icon name={m.icon} className="text-xl" />
                </span>
                <h3 className="mt-space-md font-headline text-headline-sm text-on-surface">
                  {m.title}
                </h3>
                <p className="mt-space-sm text-body-md text-on-surface-variant">{m.body}</p>
                {m.highlight && (
                  <Chip tone="primary" icon="auto_awesome" className="mt-space-md">
                    What other apps can&apos;t do
                  </Chip>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ the formula ══ */}
      <section className="mt-space-xl grid gap-gutter-lg lg:grid-cols-[1fr_20rem]">
        <Card className="p-space-lg">
          <h2 className="font-headline text-headline-md text-on-surface">The match score</h2>
          <p className="mt-space-sm text-body-md text-on-surface-variant">
            Five weighted components, summing to exactly 100. Every match card can show you this
            breakdown live.
          </p>

          <div className="mt-space-md space-y-space-md">
            {WEIGHT_ROWS.map((row, i) => {
              const weight = weights[row.key] || 0
              return (
                <motion.div
                  key={row.key}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex items-baseline justify-between gap-space-sm">
                    <span className="text-label-lg text-on-surface">{row.label}</span>
                    <span className="text-label-lg tnum text-primary">{weight} pts</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container-high">
                    <motion.span
                      initial={{ width: 0 }}
                      whileInView={{ width: `${weight}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="block h-full rounded-full bg-primary"
                    />
                  </div>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{row.body}</p>
                </motion.div>
              )
            })}
          </div>

          <pre className="mt-space-lg overflow-x-auto rounded-xl bg-inverse-surface p-space-md text-body-sm text-inverse-on-surface">
{`score = ${weights.time ?? 45} × time_proximity
      + ${weights.destination ?? 20} × destination_match
      + ${weights.pickup ?? 15} × pickup_proximity
      + ${weights.seats ?? 12} × seat_fit
      + ${weights.luggage ?? 8} × luggage_fit

time_proximity = max(0, 1 − Δminutes / flex_window)`}
          </pre>
        </Card>

        <aside className="space-y-gutter">
          <Card className="p-space-md">
            <h3 className="font-headline text-headline-sm text-on-surface">Safety by design</h3>
            <ul className="mt-space-sm space-y-space-sm text-body-sm text-on-surface-variant">
              {[
                `Only @${meta?.email_domains?.[0]} emails can register.`,
                'Phone numbers stay hidden until both sides are on the same ride.',
                'Hosts can restrict a ride to same-gender co-riders.',
                'Seats are booked in one transaction, so a cab can never be oversold.',
              ].map((t) => (
                <li key={t} className="flex gap-1.5">
                  <Icon name="check_circle" fill className="text-base text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-primary p-space-md text-on-primary">
            <h3 className="font-headline text-headline-sm">Ready to try it?</h3>
            <p className="mt-space-sm text-body-sm text-primary-fixed/90">
              Post a trip in under 60 seconds and we&apos;ll rank every verified student leaving in
              your window.
            </p>
            <Button
              as={Link}
              to={isLoggedIn ? '/post' : '/auth'}
              className="mt-space-md w-full bg-white text-primary hover:bg-white/90"
              icon="rocket_launch"
            >
              {isLoggedIn ? 'Post a ride' : 'Join with your college email'}
            </Button>
          </Card>
        </aside>
      </section>
    </div>
  )
}
