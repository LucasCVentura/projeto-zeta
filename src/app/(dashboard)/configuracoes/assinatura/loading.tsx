export default function Loading() {
  return (
    <div className="container-page max-w-xl py-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-muted" />
        <div className="space-y-1">
          <div className="h-6 w-28 rounded-lg bg-muted" />
          <div className="h-4 w-44 rounded bg-muted" />
        </div>
      </div>
      <div className="surface space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 rounded-lg bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
