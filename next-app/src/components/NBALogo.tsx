export default function NBALogo({ className = "h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GOAT"
    >
      {/* Icon circle background */}
      <circle cx="26" cy="26" r="26" fill="url(#iconGrad)" />

      {/* Goat silhouette — stylized mountain goat head */}
      <g transform="translate(10, 6)">
        {/* Left horn */}
        <path
          d="M10 4 Q6 0 3 6 Q5 8 8 10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right horn */}
        <path
          d="M22 4 Q26 0 29 6 Q27 8 24 10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Head shape */}
        <path
          d="M8 10 Q8 6 16 5 Q24 6 24 10 Q26 16 24 22 Q22 27 16 30 Q10 27 8 22 Q6 16 8 10Z"
          fill="white"
        />
        {/* Eyes */}
        <ellipse cx="12" cy="16" rx="1.8" ry="2" fill="#1D428A" />
        <ellipse cx="20" cy="16" rx="1.8" ry="2" fill="#1D428A" />
        {/* Nose */}
        <ellipse cx="14" cy="23" rx="1.2" ry="1" fill="#1D428A" opacity="0.5" />
        <ellipse cx="18" cy="23" rx="1.2" ry="1" fill="#1D428A" opacity="0.5" />
        {/* Beard tuft */}
        <path
          d="M14 30 Q16 36 18 30"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Basketball texture lines on circle */}
      <path
        d="M26 0 Q26 26 26 52"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.15"
      />
      <path
        d="M0 26 Q26 26 52 26"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.15"
      />

      {/* GOAT text */}
      <text
        x="64"
        y="33"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="32"
        letterSpacing="3"
        fill="url(#textGrad)"
      >
        GOAT
      </text>

      {/* Subtle underline accent */}
      <rect x="64" y="39" width="108" height="2.5" rx="1.25" fill="url(#lineGrad)" opacity="0.6" />

      {/* Gradients */}
      <defs>
        <linearGradient id="iconGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C8102E" />
          <stop offset="100%" stopColor="#1D428A" />
        </linearGradient>
        <linearGradient id="textGrad" x1="64" y1="10" x2="172" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D428A" />
          <stop offset="50%" stopColor="#2856A3" />
          <stop offset="100%" stopColor="#C8102E" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="64" y1="0" x2="172" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C8102E" />
          <stop offset="100%" stopColor="#1D428A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
