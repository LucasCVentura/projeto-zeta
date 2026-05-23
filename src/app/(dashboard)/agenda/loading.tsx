export default function Loading() {
  return (
    <div className="container-page py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="h-8 w-24 rounded-lg bg-muted" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 w-14 shrink-0 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-4 w-12 rounded bg-muted shrink-0" />
            <div className="h-14 flex-1 rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
