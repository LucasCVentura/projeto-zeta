import Image from "next/image"

export function KiraMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/kira-bonsai-512.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
