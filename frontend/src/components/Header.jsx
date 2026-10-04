import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { Avatar, Button, Chip, Icon } from './ui'
import { useAuth } from '../context/AuthContext'
import { useMeta } from '../context/MetaContext'
import { useToast } from '../context/ToastContext'

const LINKS = [
  { to: '/find', label: 'Find Rides', icon: 'search' },
  { to: '/post', label: 'Post a Ride', icon: 'add_road' },
  { to: '/dashboard', label: 'My Rides', icon: 'commute' },
  { to: '/how-it-works', label: 'How it Works', icon: 'help' },
]

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-space-sm ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-on-primary shadow-e1">
        <Icon name="local_taxi" className="text-xl" fill />
      </span>
      <span className="font-headline text-headline-md font-bold tracking-tight text-primary">
        RidePair
      </span>
    </Link>
  )
}

export default function Header() {
  const { user, logout } = useAuth()
  const { meta } = useMeta()
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)

  const signOut = () => {
    logout()
    toast('Signed out. See you soon!', 'info')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/40 bg-surface-container-lowest/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-space-md px-margin md:px-margin-md">
        <Logo />

        {/* desktop nav */}
        <nav className="ml-space-lg hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-space-md py-space-sm text-label-lg transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-space-sm">
          <Chip tone="primary" icon="verified_user" className="hidden xl:inline-flex">
            Safety &amp; Verified {meta?.email_domains?.[0] ? `@${meta.email_domains[0]}` : '.edu'}
          </Chip>

          {user ? (
            <>
              <Button as={Link} to="/post" size="sm" icon="add" className="hidden sm:inline-flex">
                Post Ride
              </Button>

              <Link
                to="/dashboard"
                className="flex items-center gap-space-sm rounded-full bg-surface-container-low py-1 pl-1 pr-space-sm transition-colors hover:bg-surface-container"
              >
                <Avatar name={user.name} size="sm" verified />
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="text-label-sm text-on-surface">{user.name}</span>
                  <span className="text-[10px] text-primary">{user.college?.split(' ')[0]} verified</span>
                </span>
              </Link>

              <button
                onClick={signOut}
                title="Sign out"
                className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
              >
                <Icon name="logout" className="text-lg" />
              </button>
            </>
          ) : (
            <Button as={Link} to="/auth" size="sm" icon="login">
              Sign in
            </Button>
          )}

          {/* mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container lg:hidden"
            aria-label="Menu"
          >
            <Icon name={open ? 'close' : 'menu'} className="text-xl" />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-outline-variant/40 bg-surface-container-lowest lg:hidden"
          >
            <div className="flex flex-col gap-1 px-margin py-space-sm">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-space-sm rounded-lg px-space-md py-space-sm text-label-lg ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`
                  }
                >
                  <Icon name={link.icon} className="text-lg" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
