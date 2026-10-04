import { Logo } from './Header'
import { Icon } from './ui'
import { useMeta } from '../context/MetaContext'

export default function Footer() {
  const { meta } = useMeta()
  const hubs = (meta?.hubs || []).slice(0, 3)

  return (
    <footer className="mt-space-2xl border-t border-outline-variant/40 bg-surface-container-lowest">
      <div className="mx-auto grid max-w-[1200px] gap-gutter-lg px-margin py-space-xl md:grid-cols-4 md:px-margin-md">
        <div>
          <Logo />
          <p className="mt-space-sm max-w-xs text-body-sm text-on-surface-variant">
            Peer-to-peer campus transit coordinating safe, verified student carpools and cab splits.
          </p>
        </div>

        <FooterCol title="Campus hub routes">
          {hubs.map((h) => (
            <li key={h.name}>{h.name}</li>
          ))}
        </FooterCol>

        <FooterCol title={`Safety trust & ${meta?.email_domains?.[0] || 'college email'}`}>
          <li className="flex gap-1.5">
            <Icon name="shield" className="mt-0.5 text-base text-primary" />
            Mandatory college email verification for every host and passenger before travel.
          </li>
        </FooterCol>

        <FooterCol title="Hackathon prototype">
          <li>
            Built for collegiate mobility and micro-commute coordination. Not an official
            transport operator.
          </li>
        </FooterCol>
      </div>

      <div className="border-t border-outline-variant/40">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-space-sm px-margin py-space-md text-body-sm text-on-surface-variant md:px-margin-md">
          <span>© {new Date().getFullYear()} RidePair Campus Mobility · Verified Student Network</span>
          <span className="flex gap-space-md">
            <span>Community Guidelines</span>
            <span>Student Safety Centre</span>
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="mb-space-sm text-label-sm uppercase tracking-wider text-on-surface">
        {title}
      </h4>
      <ul className="space-y-1.5 text-body-sm text-on-surface-variant">{children}</ul>
    </div>
  )
}
