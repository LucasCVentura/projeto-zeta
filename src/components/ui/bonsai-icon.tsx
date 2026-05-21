export function BonsaiIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Tronco */}
      <path d="M12 21v-6" />
      {/* Base / vaso */}
      <path d="M9 21h6" />
      {/* Galho esquerdo */}
      <path d="M12 15c-2-1-5-1-6-4" />
      {/* Galho direito */}
      <path d="M12 15c2-1 5-1 6-4" />
      {/* Copa esquerda */}
      <path d="M6 11c-1-2 0-5 3-5" />
      {/* Copa direita */}
      <path d="M18 11c1-2 0-5-3-5" />
      {/* Copa central/topo */}
      <path d="M9 6c0-2 1.5-4 3-4s3 2 3 4" />
      {/* Folhagem — arcos suaves */}
      <path d="M5 11c0 2 2 3 4 3" />
      <path d="M19 11c0 2-2 3-4 3" />
      <path d="M8 14c1 1 2.5 1.5 4 1" />
    </svg>
  )
}
