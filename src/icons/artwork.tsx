import type { ReactNode } from 'react'

type ArtProps = { id: string }

function shine(id: string) {
  return (
    <>
      <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.04" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <path d="M8 0h84c4 0 8 4 8 8v28C70 48 30 48 0 36V8C0 4 4 0 8 0Z" fill={`url(#${id}-shine)`} />
    </>
  )
}

export const artwork: Record<string, (props: ArtProps) => ReactNode> = {
  'seo-auditor': ({ id }) => (
    <>
      <circle cx="42" cy="40" r="18" fill="none" stroke="#fff" strokeWidth="5" />
      <path d="M55 53 74 74" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path d="M28 72h22c0-8-6-12-11-12s-11 4-11 12Z" fill="#fff" opacity="0.9" />
      {shine(id)}
    </>
  ),
  'code-review': ({ id }) => (
    <>
      <path d="M30 34 18 50l12 16" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M70 34 82 50 70 66" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M54 28 44 72" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'brand-designer': ({ id }) => (
    <>
      <circle cx="34" cy="38" r="12" fill="#fff" />
      <circle cx="54" cy="32" r="10" fill="#fff" opacity="0.75" />
      <circle cx="68" cy="48" r="11" fill="#fff" opacity="0.55" />
      <path d="M28 72c8-14 20-14 28 0" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'legal-contracts': ({ id }) => (
    <>
      <path d="M32 22h28l12 12v46H32Z" fill="#fff" />
      <path d="M60 22v12h12" fill="none" stroke="currentColor" strokeWidth="0" />
      <path d="M60 22v12h12" stroke="#000" strokeOpacity="0.15" strokeWidth="3" fill="none" />
      <rect x="40" y="44" width="20" height="3.5" rx="1" fill="#1c1c1e" opacity="0.35" />
      <rect x="40" y="52" width="28" height="3.5" rx="1" fill="#1c1c1e" opacity="0.25" />
      <rect x="40" y="60" width="16" height="3.5" rx="1" fill="#1c1c1e" opacity="0.2" />
      {shine(id)}
    </>
  ),
  'sales-closer': ({ id }) => (
    <>
      <path d="M22 68 40 50l14 12 24-30" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 32h18v18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {shine(id)}
    </>
  ),
  'qa-playwright': ({ id }) => (
    <>
      <rect x="22" y="28" width="56" height="40" rx="8" fill="none" stroke="#fff" strokeWidth="5" />
      <circle cx="40" cy="48" r="4" fill="#fff" />
      <circle cx="60" cy="48" r="4" fill="#fff" />
      <path d="M38 62c8 6 16 6 24 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 22v10" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'support-desk': ({ id }) => (
    <>
      <path d="M28 52a22 22 0 1 1 44 0v10a8 8 0 0 1-8 8H50" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" />
      <rect x="22" y="48" width="12" height="20" rx="6" fill="#fff" />
      <rect x="66" y="48" width="12" height="20" rx="6" fill="#fff" />
      {shine(id)}
    </>
  ),
  'finance-close': ({ id }) => (
    <>
      <circle cx="50" cy="50" r="24" fill="none" stroke="#fff" strokeWidth="5.5" />
      <path d="M50 32v36M42 40c6-6 16-4 16 4s-8 6-16 8 12 10 18 4" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'meeting-notes': ({ id }) => (
    <>
      <rect x="28" y="24" width="44" height="54" rx="7" fill="#fff" />
      <rect x="38" y="20" width="24" height="10" rx="3" fill="#fff" />
      <rect x="36" y="42" width="28" height="3.5" rx="1.5" fill="#1c1c1e" opacity="0.28" />
      <rect x="36" y="50" width="22" height="3.5" rx="1.5" fill="#1c1c1e" opacity="0.2" />
      <rect x="36" y="58" width="26" height="3.5" rx="1.5" fill="#1c1c1e" opacity="0.16" />
      {shine(id)}
    </>
  ),
  'a11y-audit': ({ id }) => (
    <>
      <circle cx="50" cy="28" r="8" fill="#fff" />
      <path d="M28 44h44M50 44v28M34 72 50 56l16 16" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {shine(id)}
    </>
  ),
  'agency-voice': ({ id }) => (
    <>
      <path d="M30 42h14l18-14v44L44 58H30a6 6 0 0 1-6-6v-4a6 6 0 0 1 6-6Z" fill="#fff" />
      <path d="M70 38c6 6 6 18 0 24" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'pr-playbook': ({ id }) => (
    <>
      <circle cx="36" cy="30" r="7" fill="#fff" />
      <circle cx="36" cy="70" r="7" fill="#fff" />
      <circle cx="70" cy="50" r="7" fill="#fff" />
      <path d="M36 37v26M43 30h10c10 0 17 8 17 20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'frontend-design': ({ id }) => (
    <>
      <rect x="20" y="26" width="40" height="30" rx="6" fill="#fff" />
      <rect x="44" y="44" width="36" height="30" rx="6" fill="#fff" opacity="0.65" />
      <rect x="28" y="34" width="16" height="3" rx="1.5" fill="#1c1c1e" opacity="0.25" />
      {shine(id)}
    </>
  ),
  'react-best-practices': ({ id }) => (
    <>
      <ellipse cx="50" cy="50" rx="28" ry="12" fill="none" stroke="#fff" strokeWidth="4" transform="rotate(0 50 50)" />
      <ellipse cx="50" cy="50" rx="28" ry="12" fill="none" stroke="#fff" strokeWidth="4" transform="rotate(60 50 50)" />
      <ellipse cx="50" cy="50" rx="28" ry="12" fill="none" stroke="#fff" strokeWidth="4" transform="rotate(120 50 50)" />
      <circle cx="50" cy="50" r="6" fill="#fff" />
      {shine(id)}
    </>
  ),
  'find-skills': ({ id }) => (
    <>
      <circle cx="46" cy="44" r="18" fill="none" stroke="#fff" strokeWidth="5.5" />
      <path d="M60 58 78 78" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" />
      <path d="M40 36h12M46 30v12" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'web-design-guidelines': ({ id }) => (
    <>
      <rect x="22" y="28" width="56" height="44" rx="8" fill="none" stroke="#fff" strokeWidth="5" />
      <path d="M22 40h56" stroke="#fff" strokeWidth="5" />
      <circle cx="32" cy="34" r="2.4" fill="#fff" />
      <circle cx="40" cy="34" r="2.4" fill="#fff" />
      <rect x="32" y="50" width="20" height="12" rx="3" fill="#fff" />
      {shine(id)}
    </>
  ),
  'skill-creator': ({ id }) => (
    <>
      <path d="M50 20 56 42h22L60 56l6 22-16-12-16 12 6-22-18-14h22Z" fill="#fff" />
      {shine(id)}
    </>
  ),
  'composition-patterns': ({ id }) => (
    <>
      <rect x="22" y="22" width="34" height="34" rx="8" fill="#fff" opacity="0.95" />
      <rect x="44" y="44" width="34" height="34" rx="8" fill="#fff" opacity="0.55" />
      {shine(id)}
    </>
  ),
  pdf: ({ id }) => (
    <>
      <path d="M30 20h28l16 16v46H30Z" fill="#fff" />
      <path d="M58 20v16h16" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="3" />
      <text x="50" y="64" textAnchor="middle" fill="#c41e3a" fontSize="16" fontWeight="800" fontFamily="system-ui">
        PDF
      </text>
      {shine(id)}
    </>
  ),
  'mcp-builder': ({ id }) => (
    <>
      <circle cx="32" cy="50" r="10" fill="#fff" />
      <circle cx="68" cy="32" r="8" fill="#fff" />
      <circle cx="68" cy="68" r="8" fill="#fff" />
      <path d="M40 46 60 36M40 54l20 10" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {shine(id)}
    </>
  ),
  'webapp-testing': ({ id }) => (
    <>
      <rect x="18" y="26" width="64" height="48" rx="8" fill="#fff" />
      <rect x="18" y="26" width="64" height="12" rx="8" fill="#fff" />
      <circle cx="28" cy="32" r="2" fill="#1c1c1e" opacity="0.3" />
      <path d="M36 56 46 64 66 44" fill="none" stroke="#1c1c1e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
      {shine(id)}
    </>
  ),
  'doc-coauthoring': ({ id }) => (
    <>
      <rect x="24" y="26" width="34" height="46" rx="6" fill="#fff" />
      <rect x="42" y="34" width="34" height="46" rx="6" fill="#fff" opacity="0.7" />
      <rect x="50" y="46" width="18" height="3" rx="1.5" fill="#1c1c1e" opacity="0.25" />
      <rect x="50" y="54" width="14" height="3" rx="1.5" fill="#1c1c1e" opacity="0.18" />
      {shine(id)}
    </>
  ),
  'react-native-skills': ({ id }) => (
    <>
      <rect x="34" y="16" width="32" height="68" rx="8" fill="#fff" />
      <rect x="38" y="24" width="24" height="44" rx="3" fill="#1c1c1e" opacity="0.18" />
      <circle cx="50" cy="74" r="3" fill="#1c1c1e" opacity="0.25" />
      {shine(id)}
    </>
  ),
  'vercel-optimize': ({ id }) => (
    <>
      <circle cx="50" cy="54" r="24" fill="none" stroke="#fff" strokeWidth="5.5" />
      <path d="M32 54a18 18 0 0 1 32-8" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 54 64 36" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="54" r="4" fill="#fff" />
      {shine(id)}
    </>
  ),
  'deploy-to-vercel': ({ id }) => (
    <>
      <path d="M50 24 78 72H22Z" fill="#fff" />
      {shine(id)}
    </>
  ),
  'writing-guidelines': ({ id }) => (
    <>
      <path d="M28 70 64 22l12 8-36 48-14 4Z" fill="#fff" />
      <path d="M60 26 70 34" stroke="#1c1c1e" strokeOpacity="0.2" strokeWidth="3" />
      {shine(id)}
    </>
  ),
}

export function fallbackArt({ id }: ArtProps) {
  return (
    <>
      <circle cx="50" cy="50" r="18" fill="#fff" opacity="0.9" />
      {shine(id)}
    </>
  )
}
