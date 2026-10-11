import { LayoutDashboard, MessageCircle, Package, RefreshCw, Settings } from 'lucide-react';
import type { View } from '../hooks/useHashRoute';

// Navigation styled like store aisle signs: each view has an aisle number.
const ITEMS: { view: View; label: string; icon: typeof Package }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'essentials', label: 'Essentials', icon: Package },
  { view: 'reorders', label: 'Reorders', icon: RefreshCw },
  { view: 'assistant', label: 'Assistant', icon: MessageCircle },
  { view: 'settings', label: 'Settings', icon: Settings },
];

interface NavigationProps {
  current: View;
  pendingReorders: number;
}

function Logo() {
  return (
    <a className="logo" href="#/dashboard" aria-label="WorthIt home">
      Worth<span className="logo-tag">It</span>
    </a>
  );
}

function NavLinks({ current, pendingReorders, variant }: NavigationProps & { variant: 'top' | 'bottom' }) {
  return (
    <ul className={variant === 'top' ? 'aisle-list' : 'bottom-nav-list'}>
      {ITEMS.map(({ view, label, icon: Icon }, index) => (
        <li key={view}>
          <a
            href={`#/${view}`}
            className={`nav-link${current === view ? ' active' : ''}`}
            aria-current={current === view ? 'page' : undefined}
          >
            {variant === 'top' ? (
              <span className="aisle-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
            ) : (
              <Icon size={22} aria-hidden="true" />
            )}
            <span className="nav-label">{label}</span>
            {view === 'reorders' && pendingReorders > 0 && (
              <span className="nav-count" aria-label={`${pendingReorders} awaiting approval`}>
                {pendingReorders}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Desktop: one dark bar across the top. Mobile: logo bar on top, tabs at the bottom. */
export function TopBar(props: NavigationProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        <Logo />
        <nav aria-label="Main" className="aisle-nav">
          <NavLinks {...props} variant="top" />
        </nav>
        <span className="demo-pill" title="Demo data and simulated responses. No purchases are made.">
          Prototype · demo data
        </span>
      </div>
    </header>
  );
}

export function BottomNav(props: NavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLinks {...props} variant="bottom" />
    </nav>
  );
}
