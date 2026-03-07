"use client";

import { Suspense } from "react";
import SessionView from "../../components/interview/SessionView";

export default function SessionPage() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <SessionView />
      </Suspense>
    </main>
  );
}
