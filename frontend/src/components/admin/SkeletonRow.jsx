export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[140, 100, 80, 90, 50, 70, 90, 90].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-100 rounded-full" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2 mt-1">
          <div className="h-2.5 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-16" />
          <div className="h-2 bg-gray-100 rounded-full w-24" />
        </div>
      </div>
    </div>
  )
}
