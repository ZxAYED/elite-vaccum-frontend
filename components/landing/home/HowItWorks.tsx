import {
  CalendarClock,
  CircleCheckBig,
  ClipboardPenLine,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <ClipboardPenLine size={24} strokeWidth={1.8} />,
    title: "Submit Request",
    description:
      "Tell us whether you need repair, maintenance, installation, or product help.",
  },
  {
    number: "02",
    icon: <CircleCheckBig size={24} strokeWidth={1.8} />,
    title: "Get Quote",
    description:
      "Receive a clear recommendation and scope before moving into scheduling.",
  },
  {
    number: "03",
    icon: <CalendarClock size={24} strokeWidth={1.8} />,
    title: "Schedule Service",
    description:
      "Choose a convenient time for a technician visit that fits your household.",
  },
  {
    number: "04",
    icon: <Sparkles size={24} strokeWidth={1.8} />,
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

        <div className="mt-12 grid auto-rows-fr gap-6 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.number} className="landing-card flex h-full flex-col px-6 py-8 text-center">
              <div className="landing-icon-tile relative mx-auto flex size-16 items-center justify-center border border-teal-100 bg-teal-50 text-teal-700">
                <div className="absolute left-1/2 top-1 flex h-7 w-7 -translate-x-[-1.35rem] items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                  {step.number}
                </div>
                {step.icon}
              </div>
              <h3 className="mt-6 min-h-[3.5rem] text-2xl font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
