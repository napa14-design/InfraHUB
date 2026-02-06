
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-[#111114] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3 rounded" />
      <Skeleton className="h-3 w-1/4 rounded" />
    </div>
    <Skeleton className="h-8 w-20 rounded-lg" />
  </div>
);

export const DashboardGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
