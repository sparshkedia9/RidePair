/* Small formatting helpers shared by every screen. */

export const CURRENCY = '₹'

export function money(amount) {
  const n = Number(amount) || 0
  return `${CURRENCY}${n.toLocaleString('en-IN')}`
}

/** "17:05" -> "5:05 PM" */
export function prettyTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h < 12 ? 'AM' : 'PM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Adds minutes to "07:15" and returns "08:05". */
export function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = (h * 60 + m + (minutes || 0)) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "2026-09-12" -> "Today" / "Tomorrow" / "Fri, 14 Sep" */
export function prettyDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Minutes -> "2h 30m" */
export function duration(minutes) {
  const m = Number(minutes) || 0
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h}h ${rest}m` : `${h}h`
}

/** Countdown to a ride: "in 2d 14h" */
export function departsIn(iso, hhmm) {
  if (!iso || !hhmm) return ''
  const when = new Date(`${iso}T${hhmm}:00`)
  const diffMs = when - new Date()
  if (diffMs <= 0) return 'Departed'
  const mins = Math.floor(diffMs / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  if (days > 0) return `in ${days}d ${hours}h`
  if (hours > 0) return `in ${hours}h ${mins % 60}m`
  return `in ${mins}m`
}

export function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function firstName(name) {
  return (name || '').split(' ')[0]
}

/* ---- vocabulary shared with the backend ---- */
export const HUB_LABEL = {
  airport: 'Airport run',
  rail: 'Rail / station',
  bus: 'Bus terminal',
  custom: 'Campus route',
}

export const HUB_ICON = {
  airport: 'flight',
  rail: 'train',
  bus: 'directions_bus',
  custom: 'place',
}

export const LUGGAGE_LABEL = {
  backpack: 'Backpack only',
  carryon: '1 cabin bag + backpack',
  checked: 'Large checked suitcase',
}

export const LUGGAGE_ICON = {
  backpack: 'backpack',
  carryon: 'luggage',
  checked: 'cases',
}

export const VEHICLE_LABEL = {
  xl: 'Cab XL / Innova',
  sedan: 'Standard sedan',
  auto: 'Shared auto',
}

export const MATCH_KIND = {
  join_car: { label: 'Seat in a cab', icon: 'directions_car' },
  group_up: { label: 'Share a cab', icon: 'group_add' },
  give_seat: { label: 'Needs a seat', icon: 'front_hand' },
}

/** Seat chip colour follows the spec: amber when it's filling fast. */
export function seatTone(seatsLeft) {
  if (seatsLeft <= 0) return 'full'
  if (seatsLeft <= 2) return 'low'
  return 'open'
}
