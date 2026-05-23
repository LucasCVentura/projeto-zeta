export default function Loading() {
  return (
    <div className="container-page py-6 space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-7 w-44 rounded-lg bg-muted" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="h-[20.5rem] rounded-xl bg-muted" />
          <div className="h-[20.5rem] rounded-xl bg-muted" />
        </div>
        <div className="h-56 rounded-xl bg-muted" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
