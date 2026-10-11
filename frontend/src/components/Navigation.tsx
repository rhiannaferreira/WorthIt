import { LayoutDashboard, MessageCircle, Package, RefreshCw, Settings } from 'lucide-react';
import type { View } from '../hooks/useHashRoute';

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
    <span className="logo">
      <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--accent)" />
        <path d="M18 33l9 9 19-20" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">
        Worth<span>It</span>
      </span>
    </span>
  );
}

function NavLinks({ current, pendingReorders, variant }: NavigationProps & { variant: 'side' | 'bottom' }) {
  return (
    <ul className={variant === 'side' ? 'side-nav-list' : 'bottom-nav-list'}>
      {ITEMS.map(({ view, label, icon: Icon }) => (
        <li key={view}>
          <a
            href={`#/${view}`}
            className={`nav-link${current === view ? ' active' : ''}`}
            aria-current={current === view ? 'page' : undefined}
          >
            <Icon size={variant === 'side' ? 20 : 22} aria-hidden="true" />
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

export function Sidebar(props: NavigationProps) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav aria-label="Main">
        <NavLinks {...props} variant="side" />
      </nav>
      <div className="sidebar-note">
        <strong>Prototype mode</strong>
        <p>Demo data and simulated responses. No purchases are made.</p>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="mobile-header">
      <Logo />
      <span className="demo-pill">Demo</span>
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
