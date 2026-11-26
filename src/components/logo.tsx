export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="32" fill="currentColor" />
      <path
        d="M17 42c7-2 9-9 15-11s10-5 15-12"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="17" cy="42" r="4.5" fill="#fff" />
      <circle cx="47" cy="19" r="4.5" fill="#fff" />
    </svg>
  );
}
