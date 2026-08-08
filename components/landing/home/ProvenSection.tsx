export default function ProvenSection() {
  return (
    <section className="bg-[#F8FBFA] py-16 md:py-20">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-[2rem] border border-teal-100 bg-white px-6 py-8 shadow-[0_28px_70px_-54px_rgba(28,79,80,0.45)] md:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)] md:px-8 lg:px-10">
          <div>
            <div className="inline-flex rounded-full bg-teal-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Our Reach
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-primary sm:text-4xl md:text-5xl">
              Proven performance in <span className="text-teal-600">8,000+</span> homes.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Reputation built on surgical precision and the industry&apos;s
              longest service warranty. Experience the Elite difference today.
            </p>
          </div>

          <div>
            <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#eef7f4_0%,#ffffff_100%)] p-8 text-center ring-1 ring-teal-100">
              <div className="text-5xl font-black tracking-[-0.04em] text-slate-900 md:text-6xl">
                8000+
              </div>
              <p className="mt-3 text-lg font-medium text-primary md:text-2xl">
                Active Clients
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Trusted by homeowners, builders, and service clients across the
                region.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
