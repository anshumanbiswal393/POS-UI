import React from "react";
import { Loader2 } from "lucide-react";

/**
 * PosDashboardSkeleton
 * High-fidelity responsive skeleton loader displayed while dashboard data is fetching.
 * Mirrors the exact layout of PosDashboardManager with smooth pulse animations.
 */
export function PosDashboardSkeleton() {
  return (
    <div className="relative flex flex-col flex-1 gap-2 p-3 sm:p-4 lg:p-5 pt-2 sm:pt-2.5 lg:pt-3 lg:min-h-0 lg:overflow-hidden">
      {/* Subtle loading indicator pill */}
      <div className="flex items-center justify-between px-0.5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span>Syncing live dashboard metrics...</span>
        </div>
      </div>

      {/* 1. Top 4 KPI Cards */}
      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs animate-pulse"
          >
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-2.5 w-20 rounded bg-slate-100" />
              <div className="h-4.5 w-24 rounded bg-slate-200" />
              <div className="h-2 w-14 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Middle Row: Live Orders, Order Types Donut, Table Status */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:min-h-0 lg:flex-[1.15] lg:grid-cols-3">
        {/* Current Orders Skeleton */}
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="h-3.5 w-28 rounded bg-slate-200" />
            <div className="h-3.5 w-14 rounded-full bg-slate-100" />
          </div>
          <div className="my-1.5 flex min-h-0 flex-1 flex-col justify-around gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-6.5 w-6.5 shrink-0 rounded-md bg-slate-200" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3 w-20 rounded bg-slate-200" />
                    <div className="h-2 w-14 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-5 w-20 shrink-0 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="shrink-0 border-t border-slate-100 pt-1.5 flex justify-center">
            <div className="h-3 w-28 rounded bg-slate-100" />
          </div>
        </div>

        {/* Order Types Donut Skeleton */}
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-around gap-3 pt-1.5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-slate-100">
              <div className="h-4 w-6 rounded bg-slate-200" />
            </div>
            <div className="space-y-2.5 flex-1 max-w-[130px]">
              <div className="h-2.5 w-full rounded bg-slate-100" />
              <div className="h-2.5 w-4/5 rounded bg-slate-100" />
              <div className="h-2.5 w-3/5 rounded bg-slate-100" />
            </div>
          </div>
        </div>

        {/* Table Status Skeleton */}
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="h-3.5 w-24 rounded bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-100" />
          </div>
          <div className="mt-2 grid min-h-0 flex-1 grid-cols-6 grid-rows-3 gap-1.5">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-slate-100 border border-slate-200/50" />
            ))}
          </div>
          <div className="mt-2 flex shrink-0 items-center justify-center gap-4 border-t border-slate-100 pt-2">
            <div className="h-2 w-14 rounded bg-slate-100" />
            <div className="h-2 w-14 rounded bg-slate-100" />
            <div className="h-2 w-14 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Payment Summary, Top Selling Items, Attention Needed */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        {/* Payment Summary Skeleton */}
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse">
          <div className="h-3.5 w-28 rounded bg-slate-200" />
          <div className="mt-2 flex min-h-0 flex-1 flex-col justify-between gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-16 rounded bg-slate-100" />
                  <div className="h-2.5 w-14 rounded bg-slate-200" />
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="mt-2 flex shrink-0 items-center justify-between border-t border-slate-100 pt-2">
            <div className="h-3 w-12 rounded bg-slate-200" />
            <div className="h-4.5 w-20 rounded bg-slate-200" />
          </div>
        </div>

        {/* Top Selling Items Skeleton */}
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="h-3.5 w-28 rounded bg-slate-200" />
            <div className="h-3 w-12 rounded bg-slate-100" />
          </div>
          <div className="mt-1 flex min-h-0 flex-1 flex-col justify-around divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100" />
                  <div className="space-y-1">
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-2 w-14 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-3.5 w-14 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Attention Needed Skeleton */}
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse">
          <div className="h-3.5 w-28 rounded bg-slate-200" />
          <div className="mt-2 flex min-h-0 flex-1 flex-col justify-around gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100" />
                  <div className="h-3 w-32 rounded bg-slate-200" />
                </div>
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Operational Metrics Strip Skeleton */}
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-2xs"
          >
            <div className="h-8.5 w-8.5 shrink-0 rounded-lg bg-slate-100" />
            <div className="space-y-1 flex-1">
              <div className="h-2.5 w-20 rounded bg-slate-100" />
              <div className="h-4 w-12 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PosDashboardSkeleton;

