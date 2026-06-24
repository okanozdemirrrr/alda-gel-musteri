'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function RestaurantListSkeleton() {
  return (
    <div className="app-page app-container px-3 py-4 space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 p-3 bg-white rounded-2xl border border-stone-100">
          <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 py-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function OrderListSkeleton() {
  return (
    <div className="app-content-narrow px-3 py-4 space-y-4">
      <Skeleton className="h-8 w-40" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 border border-stone-100 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function RestaurantMenuSkeleton() {
  return (
    <div className="app-page">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MarketCategorySkeleton() {
  return (
    <div className="app-page px-4 py-4 space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
