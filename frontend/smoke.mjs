/* Smoke-test harness.
 *
 *   1. start the backend:  python -m uvicorn backend.main:app --reload
 *   2. npm run smoke
 *
 * Pulls real payloads from the live API, mounts every route in jsdom, and
 * fails if any screen crashes or is missing its key content. Catches the
 * white-screen class of bug that a production build happily compiles.
 */
import { JSDOM } from 'jsdom'

const API = process.env.RIDEPAIR_API || 'http://127.0.0.1:8000'
const LOGIN = { email: 'rahul@lpu.in', password: 'ridepair123' }

async function call(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`)
  return res.json()
}

// Local date, not UTC — the backend seeds rides using the server's local day.
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

let data
try {
  const meta = await call('GET', '/api/meta')
  const auth = await call('POST', '/api/auth/login', LOGIN)
  const token = auth.access_token
  const matches = await call('POST', '/api/rides/match', {
    ride_type: 'seek',
    from_location: meta.pickup_points[0].name,
    to_location: meta.hubs[0].name,
    ride_date: today,
    depart_time: '17:20',
    time_flex: 30,
    group_size: 1,
    luggage: 'carryon',
  }, token)
  const dashboard = await call('GET', '/api/rides/dashboard', undefined, token)
  const stats = await call('GET', '/api/rides/campus-stats')
  const rideId = matches[0]?.ride?.id || dashboard.upcoming[0]?.id || 1
  const ride = await call('GET', `/api/rides/${rideId}`, undefined, token)
  data = { meta, user: auth.user, matches, dashboard, stats, ride }
  console.log(`Live API: ${matches.length} matches, ${dashboard.upcoming.length} upcoming rides\n`)
} catch (err) {
  console.error(`Cannot reach the backend at ${API} — start it first.\n  ${err.message}`)
  process.exit(1)
}

/* ---- browser environment ---- */
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})
for (const key of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement',
  'Element', 'Node', 'CustomEvent', 'Event', 'getComputedStyle', 'SVGElement']) {
  // Node 24 exposes some of these (notably `navigator`) as getter-only globals,
  // so assignment throws — defineProperty overrides them cleanly.
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    writable: true,
    configurable: true,
  })
}
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)

const matchMedia = () => ({
  matches: false, media: '',
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {},
})
globalThis.matchMedia = matchMedia
dom.window.matchMedia = matchMedia
dom.window.scrollTo = () => {}

// jsdom ships no IntersectionObserver; every target browser has one.
class IntersectionObserverStub {
  constructor(cb) { this.cb = cb }
  observe(el) { this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this) }
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
globalThis.IntersectionObserver = IntersectionObserverStub
dom.window.IntersectionObserver = IntersectionObserverStub

globalThis.IS_REACT_ACT_ENVIRONMENT = true
process.env.SMOKE_DATA = JSON.stringify(data)

await import('./ssr-out/dom-smoke.js')
