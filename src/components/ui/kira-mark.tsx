import Image from "next/image"

export function KiraMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/kira-bonsai-mark.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      unoptimized
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
