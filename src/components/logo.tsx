export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path d="M14 44c8-2 10-10 18-12s12-6 18-14" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="14" cy="44" r="5" fill="#fff" />
      <circle cx="50" cy="18" r="5" fill="#fff" />
    </svg>
  );
}
