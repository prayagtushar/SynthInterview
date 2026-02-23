export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Comic It</h1>
      <p className="text-lg text-slate-600">
        Next.js frontend is ready. Connect it to the FastAPI orchestrator in <code>apps/api</code>.
      </p>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Stack</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
          <li>Next.js + Tailwind CSS</li>
          <li>FastAPI backend with WebSocket support</li>
          <li>Gemini + Imagen pipeline orchestration</li>
          <li>Firestore and Google Cloud Storage integration points</li>
        </ul>
      </section>
    </main>
  );
}
