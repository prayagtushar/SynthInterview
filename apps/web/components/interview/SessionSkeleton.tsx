import { Skeleton } from "@/components/ui/Skeleton";

export function SessionSkeleton() {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-300 font-sans selection:bg-blue-500/30">
      {/* Sidebar Skeleton */}
      <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-slate-900/20">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 flex flex-col gap-6">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header Skeleton */}
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-5 bg-slate-950/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <div className="flex flex-col gap-1">
                <Skeleton className="w-20 h-2" />
                <Skeleton className="w-12 h-1.5" />
              </div>
            </div>
            <Skeleton className="w-24 h-6 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-6 rounded-lg" />
            <Skeleton className="w-32 h-6 rounded-full" />
            <Skeleton className="w-20 h-8 rounded-lg" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[#020617]">
          {/* Editor Panel area */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
            <div className="h-10 border-b border-white/5 bg-slate-900/40 flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-16 h-4" />
              </div>
              <Skeleton className="w-24 h-6 rounded-md" />
            </div>
            <div className="flex-1 p-8 space-y-4">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-4" />
              <Skeleton className="w-2/3 h-4" />
              <Skeleton className="w-1/3 h-4" />
              <Skeleton className="w-full h-64 rounded-xl" />
            </div>
          </div>

          {/* Right Panel area */}
          <div className="w-[450px] flex flex-col bg-slate-950/50">
            <div className="h-10 border-b border-white/5 bg-slate-900/40 flex items-center px-4">
              <Skeleton className="w-20 h-4" />
            </div>
            <div className="flex-1 p-6 space-y-6">
              <Skeleton className="w-full h-40 rounded-2xl" />
              <Skeleton className="w-full h-64 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
