import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Wrench,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <ClipboardList size={24} strokeWidth={1.8} />,
    title: "Submit Request",
    description:
      "Tell us whether you need repair, maintenance, installation, or product help.",
  },
  {
    number: "02",
    icon: <CheckCircle2 size={24} strokeWidth={1.8} />,
    title: "Get Quote",
    description:
      "Receive a clear recommendation and scope before moving into scheduling.",
  },
  {
    number: "03",
    icon: <CalendarDays size={24} strokeWidth={1.8} />,
    title: "Schedule Service",
    description:
      "Choose a convenient time for a technician visit that fits your household.",
  },
  {
    number: "04",
    icon: <Wrench size={24} strokeWidth={1.8} />,
    title: "Service Completed",
    description:
      "We complete the work, confirm system performance, and leave you with the next best step.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex rounded-full bg-teal-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Simple Process
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-primary sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Professional central vacuum service in four simple steps.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {steps.map((step) => (
            <article
              className="relative rounded-[2rem] border border-teal-100 bg-white px-6 py-8 text-center shadow-[0_24px_56px_-48px_rgba(28,79,80,0.55)]"
              key={step.number}
            >
              <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-teal-700">
                <div className="absolute left-1/2 top-4 flex h-7 w-7 -translate-x-[-1.5rem] items-center justify-center rounded-full bg-primary text-xs font-semibold text-white shadow-sm">
                  {step.number}
                </div>
                {step.icon}
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 hidden items-center justify-center gap-2 lg:flex">
          <div className="h-px w-24 bg-teal-200" />
          <div className="h-px w-24 bg-teal-200" />
          <div className="h-px w-24 bg-teal-200" />
        </div>
      </div>
    </section>
  );
}
