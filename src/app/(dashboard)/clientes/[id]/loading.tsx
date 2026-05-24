export default function Loading() {
  return (
    <div className="container-page max-w-2xl py-6 space-y-6 animate-pulse">
      <div className="h-5 w-16 rounded-lg bg-muted" />
      {/* Header card */}
      <div className="surface flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-40 rounded-lg bg-muted" />
          <div className="flex gap-4">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        </div>
      </div>
      {/* Sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="surface space-y-3">
          <div className="h-5 w-32 rounded-lg bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
