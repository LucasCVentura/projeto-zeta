export default function Loading() {
  return (
    <div className="container-page py-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-muted" />
        <div className="h-6 w-40 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface space-y-3">
              <div className="h-5 w-32 rounded-lg bg-muted" />
              <div className="h-32 rounded-xl bg-muted" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="surface space-y-3">
            <div className="h-5 w-28 rounded-lg bg-muted" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
