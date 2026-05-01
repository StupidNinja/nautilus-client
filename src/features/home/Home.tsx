export const Home = () => {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16">
      <section className="w-full rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/60">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          React + TypeScript + Vite
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">
          Minimal starter template
        </h1>
        <p className="mt-4 text-base text-slate-600">
          This template keeps only the core stack plus quality tooling: Tailwind
          CSS, ESLint, Prettier, Husky, commitlint, and CI checks.
        </p>
        <p className="mt-3 text-base text-slate-600">
          Add routing, API clients, and state management only when your product
          requirements are clear.
        </p>
      </section>
    </main>
  );
};
