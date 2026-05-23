export default function Loading() {
  return (
    <div className="container-page py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 rounded-lg bg-muted" />
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>
      <div className="h-10 w-full rounded-xl bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
