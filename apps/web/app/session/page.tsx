"use client";

import { Suspense } from "react";
import SessionView from "../../components/interview/SessionView";
import { SessionSkeleton } from "../../components/interview/SessionSkeleton";

export default function SessionPage() {
  return (
    <main>
      <Suspense fallback={<SessionSkeleton />}>
        <SessionView />
      </Suspense>
    </main>
  );
}
