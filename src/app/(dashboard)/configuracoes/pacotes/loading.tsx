export default function Loading() {
  return (
    <div className="container-page max-w-xl py-6 space-y-4 animate-pulse">
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded-lg bg-muted" />
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
