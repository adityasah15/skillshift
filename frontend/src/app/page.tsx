export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
          SkillShift
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Find the right skills for your next project.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          SkillShift connects clients with skilled freelancers for quality,
          project-based work.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/services"
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            Browse services
          </a>

          <a
            href="/auth/register"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Get started
          </a>
        </div>
      </section>
    </main>
  );
}