/* Client-render smoke test.

   Unlike the SSR pass, this mounts the real <App/> in jsdom so useEffect runs,
   fetches resolve against a stubbed API, and we exercise the LOADED state of
   every screen — the states a judge actually sees. */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import App from './src/App'
import { AuthProvider } from './src/context/AuthContext'
import { MetaProvider } from './src/context/MetaContext'
import { ToastProvider } from './src/context/ToastContext'

const DATA = JSON.parse(process.env.SMOKE_DATA)

/* ---- stub the network with real payloads captured from the live API ---- */
const ROUTES = [
  [/\/api\/meta$/, () => DATA.meta],
  [/\/api\/rides\/campus-stats$/, () => DATA.stats],
  [/\/api\/rides\/dashboard$/, () => DATA.dashboard],
  [/\/api\/rides\/match$/, () => DATA.matches],
  [/\/api\/rides\/\d+$/, () => DATA.ride],
  [/\/api\/auth\/me$/, () => DATA.user],
]

globalThis.fetch = async (url) => {
  const path = String(url)
  const hit = ROUTES.find(([re]) => re.test(path))
  const body = hit ? hit[1]() : {}
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  }
}

// Logged in, so protected routes render rather than redirect.
localStorage.setItem('ridepair_token', 'smoke-token')
localStorage.setItem('ridepair_user', JSON.stringify(DATA.user))

const ROUTES_TO_CHECK = [
  ['/', ['Split Cabs', 'High-frequency transit runs', 'Find matches']],
  ['/auth', ['Safe, verified campus ride-sharing', 'Quick fill demo student']],
  ['/how-it-works', ['Ranked, not just filtered', 'The match score']],
  ['/find', ['Coordinated rides', 'Request to Join', '% Match']],
  ['/post', ['Post a ride', 'Route & destination', 'Publish ride']],
  ['/dashboard', ['Welcome back', 'Money saved', 'Rider roster']],
  ['/ride/1', ['Route timeline', 'Vehicle roster', 'Your est. share']],
]

let failed = 0

for (const [route, expected] of ROUTES_TO_CHECK) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const errors = []
  const origError = console.error
  console.error = (...args) => { errors.push(args.join(' ')) }

  try {
    const root = createRoot(host)
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[route]}>
          <ToastProvider>
            <MetaProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </MetaProvider>
          </ToastProvider>
        </MemoryRouter>
      )
    })
    // let the fetch microtasks settle
    await act(async () => { await new Promise((r) => setTimeout(r, 30)) })

    const text = host.textContent || ''
    const missing = expected.filter((needle) => !text.includes(needle))
    const realErrors = errors.filter(
      (e) => !e.includes('not wrapped in act') && !e.includes('useLayoutEffect')
    )

    if (missing.length) {
      failed++
      console.error = origError
      console.log(`  FAIL  ${route.padEnd(14)} missing content: ${missing.join(' | ')}`)
    } else if (realErrors.length) {
      failed++
      console.error = origError
      console.log(`  FAIL  ${route.padEnd(14)} console error: ${realErrors[0].slice(0, 120)}`)
    } else {
      console.error = origError
      console.log(`  PASS  ${route.padEnd(14)} ${String(text.length).padStart(6)} chars · all key content present`)
    }
    root.unmount()
  } catch (err) {
    console.error = origError
    failed++
    console.log(`  FAIL  ${route.padEnd(14)} CRASH: ${err.message}`)
  }
  host.remove()
}

console.log(failed ? `\n${failed} route(s) failed` : '\nEvery route rendered its real content')
process.exit(failed ? 1 : 0)
