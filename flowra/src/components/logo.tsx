/** Flowra wordmark: a soft drop with a flowing line (inline SVG, no external assets). */
export function Logo({ className = "", withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="fl-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7A45AE" />
            <stop offset="1" stopColor="#4A2270" />
          </linearGradient>
        </defs>
        <path d="M16 2C16 2 6 13.5 6 20a10 10 0 0 0 20 0C26 13.5 16 2 16 2Z" fill="url(#fl-g)" />
        <path d="M10 21c2.5-2.2 5-2.2 7.5 0s4.2 1.6 5.5.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {withText && <span className="text-xl font-bold tracking-tight text-plum-700">Flowra</span>}
    </span>
  );
}
