"use client";

import { Send } from "lucide-react";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import {
  inputClassName,
  selectClassName,
  textAreaClassName,
} from "@/components/forms/formStyles";
import {
  FadeIn,
  Pressable,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import { useSchemaForm } from "@/lib/use-schema-form";
import { contactSchema } from "@/lib/validation";

export default function ContactForm() {
  const form = useSchemaForm({
    schema: contactSchema,
    initialValues: {
      name: "",
      email: "",
      phone: "",
      serviceCategory: "",
      message: "",
    },
    onValidSubmit: async () => ({
      type: "ready",
      message:
        "Your request passed frontend validation and is ready for API submission. Nothing has been sent yet because the contact backend is not connected.",
    }),
  });

  return (
    <>
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1440px] px-4">
          <div className="grid gap-12 md:grid-cols-3">
            <FadeIn className="md:col-span-2">
              <h2 className="mb-4 text-3xl font-bold text-primary">
                Send a Message
              </h2>
              <p className="mb-8 max-w-2xl text-slate-600">
                Have a question about installation, repair, or maintenance?
                Share the details below and this form will be ready for backend
                routing once the contact API is connected.
              </p>

              <form className="space-y-6" noValidate onSubmit={form.handleSubmit}>
                <FormStatus status={form.status} />

                <StaggerGroup className="space-y-6" delay={0.05}>
                  <StaggerItem>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        error={form.errors.name}
                        htmlFor="name"
                        label="Full Name"
                        required
                      >
                        <input
                          {...form.getInputProps("name")}
                          autoComplete="name"
                          className={inputClassName}
                          placeholder="Jordan Mercer..."
                          type="text"
                        />
                      </FormField>

                      <FormField
                        error={form.errors.email}
                        htmlFor="email"
                        label="Email Address"
                        required
                      >
                        <input
                          {...form.getInputProps("email")}
                          autoComplete="email"
                          className={inputClassName}
                          inputMode="email"
                          placeholder="name@example.com..."
                          spellCheck={false}
                          type="email"
                        />
                      </FormField>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        error={form.errors.phone}
                        htmlFor="phone"
                        label="Phone Number"
                      >
                        <input
                          {...form.getInputProps("phone")}
                          autoComplete="tel"
                          className={inputClassName}
                          inputMode="tel"
                          placeholder="+1 (203) 555-0148..."
                          type="tel"
                        />
                      </FormField>

                      <FormField
                        error={form.errors.serviceCategory}
                        htmlFor="serviceCategory"
                        label="Service Category"
                        required
                      >
                        <select
                          {...form.getInputProps("serviceCategory")}
                          className={selectClassName}
                        >
                          <option value="">Select a category...</option>
                          <option value="repair">Repair Request</option>
                          <option value="installation">Installation Planning</option>
                          <option value="maintenance">Maintenance Plan</option>
                          <option value="products">Product Support</option>
                          <option value="other">Other Inquiry</option>
                        </select>
                      </FormField>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <FormField
                      error={form.errors.message}
                      htmlFor="message"
                      label="Your Message"
                      required
                    >
                      <textarea
                        {...form.getInputProps("message")}
                        className={textAreaClassName}
                        placeholder="Tell us what you need help with..."
                        rows={5}
                      />
                    </FormField>
                  </StaggerItem>

                  <StaggerItem>
                    <Pressable className="w-full">
                      <Button
                        className="w-full rounded-full px-8 py-6 text-base"
                        disabled={form.isSubmitting}
                        type="submit"
                      >
                        {form.isSubmitting ? "Reviewing..." : "Review Message"}
                        <Send aria-hidden="true" />
                      </Button>
                    </Pressable>
                  </StaggerItem>
                </StaggerGroup>
              </form>
            </FadeIn>

            <StaggerGroup className="space-y-6" delay={0.12}>
              <StaggerItem>
                <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                    Coverage Planning
                  </p>
                  <h3 className="mt-4 text-2xl font-bold text-slate-950">
                    Replace Demo Service Areas Before Launch
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    This project intentionally avoids inventing a public office
                    address or verified coverage map. Swap this card for approved
                    territory details when the real business data is ready.
                  </p>
                  <div className="mt-6 rounded-3xl bg-[var(--brand-soft)] p-5 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">
                      Good candidates for future live data:
                    </p>
                    <ul className="mt-3 space-y-2">
                      <li>Verified states, counties, or ZIP coverage</li>
                      <li>Dispatch hours for installation and repairs</li>
                      <li>Office, showroom, or warehouse contact details</li>
                    </ul>
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="rounded-[var(--radius-card)] bg-primary p-8 text-primary-foreground">
                  <h3 className="mb-6 text-2xl font-bold text-white">
                    Quick Support FAQ
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-3 text-sm text-emerald-300">
                        Can you help with sudden suction loss?
                      </h4>
                      <p className="text-sm text-primary-foreground/90">
                        Yes. Share when the issue started and whether it affects
                        one inlet or the full system so the request is routed to
                        the right service type.
                      </p>
                    </div>

                    <div className="border-t border-white/15 pt-6">
                      <h4 className="mb-3 text-sm text-emerald-300">
                        What should I upload with a request?
                      </h4>
                      <p className="text-sm text-primary-foreground/90">
                        Photos of the power unit, inlet covers, hose handles,
                        and any visible model labels are the most helpful
                        starting point.
                      </p>
                    </div>

                    <div className="border-t border-white/15 pt-6">
                      <h4 className="mb-3 text-sm text-emerald-300">
                        Is this contact form live yet?
                      </h4>
                      <p className="text-sm text-primary-foreground/90">
                        Not yet. This pass adds validation and accessibility so
                        the form is ready for real backend wiring next.
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerGroup>
          </div>
        </div>
      </section>

      <FadeIn className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/90">
            Prepare your next service request now and connect it to live support
            once the backend workflow is enabled.
          </p>
          <Pressable>
            <Button className="rounded-full px-8 py-6 text-base" variant="secondary">
              Schedule Service
            </Button>
          </Pressable>
        </div>
      </FadeIn>
    </>
  );
}
