import type { Category } from '../types';

// Simple illustrated placeholders so cards have a visual without real product photos.

const PALETTE: Record<Category, { bg: string; main: string; accent: string }> = {
  Laundry: { bg: '#e6f2fb', main: '#4a90c9', accent: '#ffffff' },
  'Oral care': { bg: '#e9f7f1', main: '#2fae86', accent: '#ffffff' },
  'Paper goods': { bg: '#fbf3e4', main: '#f2e3c6', accent: '#d9b77a' },
  Kitchen: { bg: '#fdf6dc', main: '#f0c33c', accent: '#ffffff' },
  Cleaning: { bg: '#eeeefb', main: '#6b6bd6', accent: '#ffffff' },
  'Personal care': { bg: '#fcebef', main: '#e0718c', accent: '#ffffff' },
  Other: { bg: '#efefea', main: '#9a9a8c', accent: '#ffffff' },
};

function Shape({ category, main, accent }: { category: Category; main: string; accent: string }) {
  switch (category) {
    case 'Laundry':
      return (
        <g>
          <rect x="20" y="16" width="28" height="40" rx="7" fill={main} />
          <rect x="38" y="10" width="10" height="9" rx="2" fill={main} />
          <path d="M48 22h4a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-4" fill="none" stroke={main} strokeWidth="4" />
          <rect x="25" y="28" width="18" height="14" rx="3" fill={accent} opacity="0.85" />
        </g>
      );
    case 'Oral care':
      return (
        <g>
          <path d="M14 26h34l8 6-8 6H14a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z" fill={main} />
          <rect x="54" y="28" width="6" height="8" rx="1.5" fill={main} />
          <rect x="18" y="29" width="18" height="6" rx="3" fill={accent} opacity="0.85" />
        </g>
      );
    case 'Paper goods':
      return (
        <g>
          <rect x="16" y="14" width="34" height="42" rx="6" fill={main} stroke={accent} strokeWidth="2" />
          <ellipse cx="33" cy="14" rx="17" ry="5" fill="#fffaf0" stroke={accent} strokeWidth="2" />
          <ellipse cx="33" cy="14" rx="5" ry="2" fill={accent} />
          <path d="M50 30h8v22h-8" fill="#fffaf0" stroke={accent} strokeWidth="2" />
        </g>
      );
    case 'Kitchen':
      return (
        <g>
          <path d="M24 24h20l2 30a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill={main} />
          <rect x="28" y="12" width="12" height="12" rx="2" fill={main} />
          <circle cx="50" cy="18" r="4" fill="#cfe9f7" />
          <circle cx="54" cy="28" r="2.5" fill="#cfe9f7" />
          <rect x="27" y="34" width="14" height="10" rx="3" fill={accent} opacity="0.85" />
        </g>
      );
    case 'Personal care':
      return (
        <g>
          <rect x="22" y="26" width="24" height="32" rx="6" fill={main} />
          <rect x="30" y="16" width="8" height="10" fill={main} />
          <path d="M30 16h18v5" fill="none" stroke={main} strokeWidth="4" strokeLinecap="round" />
          <rect x="27" y="36" width="14" height="10" rx="3" fill={accent} opacity="0.85" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="16" y="22" width="36" height="32" rx="5" fill={main} />
          <path d="M16 30h36" stroke={accent} strokeWidth="3" opacity="0.7" />
          <path d="M34 22v32" stroke={accent} strokeWidth="3" opacity="0.7" />
        </g>
      );
  }
}

export function ProductArt({ category, size = 56 }: { category: Category; size?: number }) {
  const colors = PALETTE[category] ?? PALETTE.Other;
  return (
    <svg
      className="product-art"
      width={size}
      height={size}
      viewBox="0 0 68 68"
      role="img"
      aria-label={`${category} illustration`}
    >
      <rect width="68" height="68" rx="16" fill={colors.bg} />
      <Shape category={category} main={colors.main} accent={colors.accent} />
    </svg>
  );
}
