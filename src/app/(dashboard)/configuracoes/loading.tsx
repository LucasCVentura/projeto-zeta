export default function Loading() {
  return (
    <div className="container-page max-w-xl py-6 space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-muted" />
      ))}
    </div>
  )
}
