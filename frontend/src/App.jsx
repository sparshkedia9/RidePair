import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Header from './components/Header'
import Footer from './components/Footer'
import { Spinner } from './components/ui'
import { useAuth } from './context/AuthContext'
import { useMeta } from './context/MetaContext'

import Landing from './pages/Landing'
import Auth from './pages/Auth'
import FindRides from './pages/FindRides'
import PostRide from './pages/PostRide'
import RideDetails from './pages/RideDetails'
import Dashboard from './pages/Dashboard'
import HowItWorks from './pages/HowItWorks'

/* Every route change fades and lifts the new screen into place. */
function Page({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1"
    >
      {children}
    </motion.main>
  )
}

/* Screens that need a logged-in student. */
function Protected({ children }) {
  const { isLoggedIn, booting } = useAuth()
  const location = useLocation()

  if (booting) return <FullScreenLoader />
  if (!isLoggedIn) return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  return children
}

function FullScreenLoader() {
  return (
    <div className="grid flex-1 place-items-center py-space-2xl text-primary">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const { meta, error } = useMeta()

  // Always start a new screen at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.pathname])

  if (error) {
    return (
      <div className="grid min-h-full place-items-center p-margin text-center">
        <div>
          <h1 className="font-headline text-headline-lg text-error">Can&apos;t reach the server</h1>
          <p className="mt-space-sm text-body-md text-on-surface-variant">
            Start the backend, then refresh:
          </p>
          <code className="mt-space-sm inline-block rounded-lg bg-surface-container px-space-md py-space-sm">
            python -m uvicorn backend.main:app --reload
          </code>
        </div>
      </div>
    )
  }

  if (!meta) return <FullScreenLoader />

  const isAuthScreen = location.pathname === '/auth'

  return (
    <div className="flex min-h-full flex-col">
      {!isAuthScreen && <Header />}

      <Suspense fallback={<FullScreenLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><Landing /></Page>} />
            <Route path="/auth" element={<Page><Auth /></Page>} />
            <Route path="/how-it-works" element={<Page><HowItWorks /></Page>} />
            <Route
              path="/find"
              element={<Protected><Page><FindRides /></Page></Protected>}
            />
            <Route
              path="/post"
              element={<Protected><Page><PostRide /></Page></Protected>}
            />
            <Route
              path="/ride/:id"
              element={<Protected><Page><RideDetails /></Page></Protected>}
            />
            <Route
              path="/dashboard"
              element={<Protected><Page><Dashboard /></Page></Protected>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {!isAuthScreen && <Footer />}
    </div>
  )
}
