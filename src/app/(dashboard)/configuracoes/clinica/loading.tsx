export default function Loading() {
  return (
    <div className="container-page max-w-xl py-6 space-y-6 animate-pulse">
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="space-y-1">
        <div className="h-7 w-24 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="surface space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-10 rounded-xl bg-muted" />
          </div>
        ))}
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>
    </div>
  )
}
