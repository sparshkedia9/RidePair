/* The origin → destination tracker from the design spec.

   A hollow emerald node marks the pickup, a dashed rail connects it to a
   filled square at the destination. Deliberately no map texture — the spec
   keeps summary feeds light so they scan instantly. */
import { Icon } from './ui'
import { HUB_ICON, prettyTime } from '../lib/format'

export default function RouteSpine({
  from,
  fromDetail,
  fromTime,
  to,
  toDetail,
  toTime,
  category = 'custom',
  corridor,
  compact = false,
}) {
  return (
    <div className={`grid grid-cols-[auto_1fr] ${compact ? 'gap-x-space-sm' : 'gap-x-space-md'}`}>
      {/* ── origin node ── */}
      <div className="flex flex-col items-center pt-1">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-surface-container-lowest" />
        <span
          className="my-1 w-0.5 flex-1 rounded"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, var(--color-primary) 0 4px, transparent 4px 8px)',
          }}
        />
        <span className="grid h-3 w-3 place-items-center rounded-[3px] bg-primary" />
      </div>

      <div className={compact ? 'space-y-space-sm' : 'space-y-space-md'}>
        {/* ── pickup ── */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-space-sm">
            {fromTime && (
              <span className="text-label-md tnum text-primary">{prettyTime(fromTime)}</span>
            )}
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              Pickup
            </span>
          </div>
          <div className="truncate text-label-lg text-on-surface">{from}</div>
          {fromDetail && (
            <div className="truncate text-body-sm text-on-surface-variant">{fromDetail}</div>
          )}
        </div>

        {/* ── corridor note between the two nodes ── */}
        {corridor && !compact && (
          <div className="flex items-center gap-1.5 text-body-sm text-secondary">
            <Icon name="alt_route" className="text-base" />
            {corridor}
          </div>
        )}

        {/* ── destination ── */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-space-sm">
            {toTime && (
              <span className="text-label-md tnum text-on-surface">{prettyTime(toTime)}</span>
            )}
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              Destination
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <Icon
              name={HUB_ICON[category] || 'place'}
              className="mt-0.5 text-base text-on-surface-variant"
            />
            <div className="min-w-0">
              <div className="truncate text-label-lg text-on-surface">{to}</div>
              {toDetail && (
                <div className="truncate text-body-sm text-on-surface-variant">{toDetail}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
