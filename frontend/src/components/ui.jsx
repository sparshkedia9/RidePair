/* ═══════════════════════════════════════════════════════════
   The RidePair component kit.
   Every visual token here comes from the Stitch design system.
   ═══════════════════════════════════════════════════════════ */
import { motion } from 'framer-motion'
import { HUB_ICON, HUB_LABEL, initialsOf, seatTone } from '../lib/format'

/* ───────────────────────── Icon ───────────────────────── */
export function Icon({ name, className = '', fill = false, style }) {
  return (
    <span
      className={`material-symbols-outlined ${fill ? 'fill' : ''} ${className}`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

/* ──────────────────────── Button ──────────────────────── */
const BUTTON_VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container shadow-e1 hover:shadow-e2',
  secondary:
    'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
  outline:
    'border border-outline-variant bg-surface-container-lowest text-secondary hover:bg-surface-container-low',
  ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  danger: 'bg-error-container text-on-error-container hover:brightness-95',
}

export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  className = '',
  children,
  ...rest
}) {
  const sizes = {
    sm: 'px-space-md py-1.5 text-label-md gap-1.5',
    md: 'px-space-lg py-space-sm text-label-lg gap-space-xs',
    lg: 'px-space-xl py-3 text-body-lg font-semibold gap-space-sm',
  }
  return (
    <Tag
      className={`inline-flex items-center justify-center rounded-lg font-semibold
        transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
        disabled:pointer-events-none disabled:opacity-55
        ${BUTTON_VARIANTS[variant]} ${sizes[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <Spinner className="h-4 w-4" />
      ) : (
        icon && <Icon name={icon} className="text-[1.15em]" />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} className="text-[1.15em]" />}
    </Tag>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  )
}

/* ───────────────────────── Chips ──────────────────────── */
export function Chip({ tone = 'neutral', icon, className = '', children }) {
  const tones = {
    neutral: 'bg-surface-container-high text-on-surface-variant',
    primary: 'bg-primary-fixed/45 text-on-primary-fixed-variant',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    warning: 'bg-warning-container text-on-warning-container',
    error: 'bg-error-container text-on-error-container',
    solid: 'bg-primary text-on-primary',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-space-sm py-1 text-label-sm whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {icon && <Icon name={icon} className="text-[0.95rem]" fill />}
      {children}
    </span>
  )
}

/** "96% Match" — the signature badge. */
export function MatchChip({ score, className = '' }) {
  const strong = score >= 85
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-space-sm py-1 text-label-sm tnum
        ${strong ? 'bg-primary-fixed/60 text-on-primary-fixed-variant' : 'bg-secondary-fixed text-on-secondary-fixed-variant'} ${className}`}
    >
      <Icon name={strong ? 'bolt' : 'insights'} className="text-[0.95rem]" fill />
      {score}% Match
    </span>
  )
}

export function HubChip({ category, className = '' }) {
  const tone = { airport: 'tertiary', rail: 'secondary', bus: 'primary' }[category] || 'neutral'
  return (
    <Chip tone={tone} icon={HUB_ICON[category] || 'place'} className={className}>
      {HUB_LABEL[category] || 'Route'}
    </Chip>
  )
}

/** Seat availability follows the spec: amber when 1-2 left. */
export function SeatChip({ seatsLeft, total }) {
  const tone = seatTone(seatsLeft)
  if (tone === 'full') return <Chip tone="error" icon="block">Full</Chip>
  return (
    <Chip tone={tone === 'low' ? 'warning' : 'neutral'} icon="airline_seat_recline_normal">
      <span className="tnum">
        {seatsLeft}{total ? `/${total}` : ''} {seatsLeft === 1 ? 'seat' : 'seats'} left
      </span>
    </Chip>
  )
}

export function VerifiedChip({ children = 'Verified .edu', className = '' }) {
  return (
    <Chip tone="primary" icon="verified" className={className}>
      {children}
    </Chip>
  )
}

/** Visual seat dots — filled for taken, hollow for open. */
export function SeatDots({ filled, total }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: Math.max(total, filled) }, (_, i) => (
        <Icon
          key={i}
          name="person"
          fill={i < filled}
          className={`text-base ${i < filled ? 'text-primary' : 'text-outline-variant'}`}
        />
      ))}
    </span>
  )
}

/* ──────────────────────── Avatar ──────────────────────── */
const AVATAR_GRADIENTS = [
  'from-primary to-primary-container',
  'from-secondary to-secondary-container',
  'from-tertiary to-tertiary-container',
  'from-primary-container to-tertiary',
]

export function Avatar({ name, size = 'md', verified = false, className = '' }) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-11 w-11 text-label-md',
    lg: 'h-14 w-14 text-body-lg',
  }
  // Stable colour per person, so the same student always looks the same.
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`inline-grid place-items-center rounded-full bg-gradient-to-br font-bold text-white
          ${AVATAR_GRADIENTS[idx]} ${sizes[size]}`}
      >
        {initialsOf(name)}
      </span>
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-surface-container-lowest">
          <Icon name="verified" fill className="text-[0.7rem] text-primary" />
        </span>
      )}
    </span>
  )
}

/* ──────────────────── Card & sections ─────────────────── */
export function Card({ className = '', hover = false, children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/45 bg-surface-container-lowest shadow-e1
        ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-outline-variant hover:shadow-e2' : ''}
        ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ icon, children }) {
  return (
    <div className="mb-space-xs flex items-center gap-1.5 text-label-sm uppercase tracking-wider text-on-surface-variant">
      {icon && <Icon name={icon} className="text-base text-primary" />}
      {children}
    </div>
  )
}

/* ──────────────────── Form controls ───────────────────── */
export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="flex items-baseline justify-between gap-space-sm">
          <span className="text-label-md text-on-surface">{label}</span>
          {hint && <span className="text-label-sm text-primary">{hint}</span>}
        </span>
      )}
      {children}
      {error && <span className="text-label-sm text-error">{error}</span>}
    </label>
  )
}

export function Input(props) {
  return <input className="field-input" {...props} />
}

export function Select({ children, ...props }) {
  return (
    <select className="field-input appearance-none pr-8" {...props}>
      {children}
    </select>
  )
}

export function Textarea(props) {
  return <textarea className="field-input resize-y" rows={3} {...props} />
}

/** Segmented control — used for Register/Login and time flexibility. */
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div
      className={`grid gap-1 rounded-xl bg-surface-container p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="relative rounded-lg px-space-sm py-space-sm text-label-md transition-colors"
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((o) => o.value).join('-')}`}
                className="absolute inset-0 rounded-lg bg-surface-container-lowest shadow-e1"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span
              className={`relative flex flex-col items-center gap-0.5 ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {opt.icon && <Icon name={opt.icon} className="text-lg" />}
              <span>{opt.label}</span>
              {opt.sub && <span className="text-label-sm opacity-70">{opt.sub}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Big selectable card — ride type, vehicle type, transit hub. */
export function ChoiceCard({ active, icon, title, detail, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-start gap-space-sm rounded-xl border p-space-md text-left transition-all duration-200
        ${active
          ? 'border-primary bg-primary-fixed/20 shadow-e1'
          : 'border-outline-variant/60 bg-surface-container-lowest hover:-translate-y-0.5 hover:border-outline-variant hover:shadow-e1'}
        ${className}`}
    >
      {icon && (
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg
            ${active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
        >
          <Icon name={icon} className="text-lg" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-label-lg text-on-surface">{title}</span>
        {detail && (
          <span className="mt-0.5 block text-body-sm text-on-surface-variant">{detail}</span>
        )}
      </span>
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-on-primary"
        >
          <Icon name="check" className="text-[0.8rem]" />
        </motion.span>
      )}
    </button>
  )
}

export function Toggle({ checked, onChange, label, detail }) {
  return (
    <div className="flex items-start justify-between gap-space-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-md">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-label-lg text-on-surface">
          <Icon name="shield_person" className="text-base text-primary" />
          {label}
        </div>
        {detail && <p className="mt-1 text-body-sm text-on-surface-variant">{detail}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-surface-container-highest'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-e1"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </div>
  )
}

/* ──────────────────── States ──────────────────── */
export function EmptyState({ icon = 'search_off', title, body, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full grid place-items-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest/60 px-space-lg py-space-2xl text-center"
    >
      <span className="mb-space-sm grid h-14 w-14 place-items-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name={icon} className="text-2xl" />
      </span>
      <h4 className="font-headline text-headline-sm text-on-surface">{title}</h4>
      {body && <p className="mt-1 max-w-sm text-body-md text-on-surface-variant">{body}</p>}
      {action && <div className="mt-space-md">{action}</div>}
    </motion.div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`h-44 animate-pulse rounded-2xl border border-outline-variant/40 bg-surface-container-low ${className}`}
    />
  )
}

/* ──────────────── Animated counters ──────────────── */
export function ProgressBar({ value, tone = 'primary', className = '' }) {
  const tones = { primary: 'bg-primary', secondary: 'bg-secondary' }
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-surface-container-high ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full ${tones[tone]}`}
      />
    </div>
  )
}
