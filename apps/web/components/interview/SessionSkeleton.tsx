import { Skeleton } from "@/components/ui/Skeleton";

export function SessionSkeleton() {
  return (
    <div className="flex h-screen bg-[#030303] overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-black">
        <Skeleton className="w-10 h-10 rounded-none bg-white/5" />
        <div className="flex flex-col gap-6">
          <Skeleton className="w-10 h-10 rounded-none bg-white/5" />
          <Skeleton className="w-10 h-10 rounded-none bg-white/5" />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header Skeleton */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 rounded-none bg-white/5" />
              <Skeleton className="w-24 h-4 bg-white/5" />
            </div>
            <Skeleton className="w-32 h-8 rounded-none bg-white/5" />
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="w-24 h-10 rounded-none bg-white/5" />
            <Skeleton className="w-32 h-10 rounded-none bg-white/5" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-black">
          {/* Editor Panel area */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
            <div className="h-12 border-b border-white/5 bg-black flex items-center px-6 justify-between">
              <div className="flex gap-6">
                <Skeleton className="w-20 h-4 bg-white/5" />
                <Skeleton className="w-20 h-4 bg-white/5" />
              </div>
              <Skeleton className="w-32 h-8 rounded-none bg-white/5" />
            </div>
            <div className="flex-1 p-10 space-y-6">
              <Skeleton className="w-3/4 h-6 bg-white/5" />
              <Skeleton className="w-1/2 h-6 bg-white/5" />
              <div className="h-[400px] w-full border border-white/5 bg-white/[0.02]" />
            </div>
          </div>

          {/* Right Panel area */}
          <div className="w-[340px] flex flex-col bg-black">
            <div className="p-8 space-y-8">
              <Skeleton className="w-full h-32 rounded-none bg-white/5" />
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-12 bg-white/5" />
                <Skeleton className="flex-1 h-12 bg-white/5" />
              </div>
              <Skeleton className="w-full h-64 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
