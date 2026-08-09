"use client";

import { Send } from "lucide-react";
import Link from "next/link";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import {
  FadeIn,
  Pressable,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useSchemaForm } from "@/lib/use-schema-form";
import { contactSchema } from "@/lib/validation";

const serviceCategoryOptions = [
  { value: "repair", label: "Repair Request" },
  { value: "installation", label: "Installation Planning" },
  { value: "maintenance", label: "Maintenance Plan" },
  { value: "products", label: "Product Support" },
  { value: "other", label: "Other Inquiry" },
] as const;

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
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-stretch">
            <FadeIn
              className="h-full rounded-[var(--radius-card)] bg-white p-6 shadow-[0_20px_60px_-46px_rgba(28,79,80,0.48)] ring-1 ring-teal-100 md:p-8"
              once={false}
            >
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                  Contact Form
                </p>
                <h2 className="mt-2 text-3xl font-bold text-primary">
                  Send a Message
                </h2>
                <p className="mt-3 max-w-2xl text-slate-600">
                  Share the service details and we will route the request to the
                  right Elite support workflow once backend wiring is connected.
                </p>
              </div>

              <form
                className="space-y-5"
                noValidate
                onSubmit={form.handleSubmit}
              >
                <FormStatus status={form.status} />

                <StaggerGroup className="space-y-5" delay={0.05} once={false}>
                  <StaggerItem>
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        error={form.errors.name}
                        htmlFor="name"
                        label="Full Name"
                        required
                      >
                        <Input
                          {...form.getInputProps("name")}
                          autoComplete="name"
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
                        <Input
                          {...form.getInputProps("email")}
                          autoComplete="email"
                          inputMode="email"
                          placeholder="name@example.com..."
                          spellCheck={false}
                          type="email"
                        />
                      </FormField>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        error={form.errors.phone}
                        htmlFor="phone"
                        label="Phone Number"
                      >
                        <Input
                          {...form.getInputProps("phone")}
                          autoComplete="tel"
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
                        <Select
                          value={String(form.values.serviceCategory ?? "")}
                          onValueChange={(value) =>
                            form.setFieldValue("serviceCategory", value)
                          }
                        >
                          <SelectTrigger
                            id="serviceCategory"
                            aria-invalid={
                              form.errors.serviceCategory ? true : undefined
                            }
                            aria-describedby={
                              form.errors.serviceCategory
                                ? form.getErrorId("serviceCategory")
                                : undefined
                            }
                            className="h-12 rounded-[var(--radius-control)]"
                          >
                            <SelectValue placeholder="Select a category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceCategoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <Textarea
                        {...form.getInputProps("message")}
                        className="min-h-36"
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

            <StaggerGroup className="h-full" delay={0.12} once={false}>
              <StaggerItem className="h-full">
                <aside className="flex h-full flex-col rounded-[var(--radius-card)] bg-primary p-6 text-primary-foreground shadow-[0_22px_64px_-48px_rgba(28,79,80,0.72)] md:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                    Support Guidance
                  </p>
                  <h3 className="mt-4 text-2xl font-bold text-white">
                    Help us route your request
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-primary-foreground/85">
                    A few specific details help our team identify the right
                    service path before we respond.
                  </p>

                  <div className="mt-6 rounded-3xl bg-white/10 p-5 text-sm ring-1 ring-white/10">
                    <p className="font-semibold text-white">
                      Include these if available:
                    </p>
                    <ul className="mt-3 space-y-2 text-primary-foreground/85">
                      <li>Power unit location and model label</li>
                      <li>Which inlet or room has the issue</li>
                      <li>Preferred visit window or urgency level</li>
                    </ul>
                  </div>

                  <div className="mt-6 space-y-6 lg:mt-auto">
                    <div className="border-t border-white/15 pt-6">
                      <h4 className="mb-3 text-sm text-emerald-300">
                        Can you help with sudden suction loss?
                      </h4>
                      <p className="text-sm text-primary-foreground/90">
                        Yes. Share when the issue started and whether it affects
                        one inlet or the full system.
                      </p>
                    </div>

                    <div className="border-t border-white/15 pt-6">
                      <h4 className="mb-3 text-sm text-emerald-300">
                        What should I upload with a request?
                      </h4>
                      <p className="text-sm text-primary-foreground/90">
                        Photos of the power unit, inlet covers, hose handles,
                        and visible model labels are most helpful.
                      </p>
                    </div>
                  </div>
                </aside>
              </StaggerItem>
            </StaggerGroup>
          </div>
        </div>
      </section>

      <FadeIn
        className="mx-auto my-10 max-w-7xl rounded-[var(--radius-card)] bg-primary py-12 text-primary-foreground md:my-14"
        once={false}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/90">
            Prepare your next service request now and connect it to live support
            once the backend workflow is enabled.
          </p>
          <Pressable>
            <Button
              asChild
              className="rounded-full bg-white px-8 py-6 text-base text-primary shadow-[0_18px_40px_-24px_rgba(255,255,255,0.75)] hover:bg-teal-50 hover:text-primary"
            >
              <Link href="/services/request?service=vacuum-repair">
                Schedule Service
              </Link>
            </Button>
          </Pressable>
        </div>
      </FadeIn>
    </>
  );
}
