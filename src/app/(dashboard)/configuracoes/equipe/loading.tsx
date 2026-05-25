export default function Loading() {
  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
      <div className="surface space-y-4">
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-48 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
