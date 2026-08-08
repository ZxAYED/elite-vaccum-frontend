"use client";

import { useMemo, useRef, useState } from "react";
import { z } from "zod";

type FormStatusType = "idle" | "ready" | "success" | "error";

export interface FormSubmissionState {
  type: FormStatusType;
  message?: string;
}

type TouchedState<TValues> = Partial<Record<keyof TValues & string, boolean>>;
type ErrorState<TValues> = Partial<Record<keyof TValues & string, string>>;

export interface SubmitResult {
  type: Exclude<FormStatusType, "idle">;
  message: string;
  resetValues?: boolean;
}

interface UseSchemaFormOptions<
  TSchema extends z.ZodType<Record<string, unknown>>,
> {
  schema: TSchema;
  initialValues: z.input<TSchema>;
  onValidSubmit?: (
    values: z.output<TSchema>,
  ) => Promise<SubmitResult> | SubmitResult;
}

function getErrorMap<TValues extends Record<string, unknown>>(
  fieldErrors: Record<string, string[] | undefined>,
) {
  return Object.entries(fieldErrors).reduce<ErrorState<TValues>>(
    (accumulator, [key, messages]) => {
      if (messages?.[0]) {
        accumulator[key as keyof TValues & string] = messages[0];
      }
      return accumulator;
    },
    {},
  );
}

export function useSchemaForm<
  TSchema extends z.ZodType<Record<string, unknown>>,
>({
  schema,
  initialValues,
  onValidSubmit,
}: UseSchemaFormOptions<TSchema>) {
  type Values = z.input<TSchema>;

  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<ErrorState<Values>>({});
  const [touched, setTouched] = useState<TouchedState<Values>>({});
  const [status, setStatus] = useState<FormSubmissionState>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const registerFieldRef = (name: keyof Values & string) => {
    return (element: HTMLElement | null) => {
      fieldRefs.current[name] = element;
    };
  };

  const focusFirstError = (nextErrors: ErrorState<Values>) => {
    const firstField = Object.keys(nextErrors)[0];
    if (firstField) {
      fieldRefs.current[firstField]?.focus();
    }
  };

  const setFieldValue = <TName extends keyof Values & string>(
    name: TName,
    value: Values[TName],
  ) => {
    setValues(
      (current) =>
        ({
          ...(current as Record<string, unknown>),
          [name]: value,
        }) as Values,
    );
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setTouched((current) => ({ ...current, [name]: true }));
    if (status.type !== "idle") {
      setStatus({ type: "idle" });
    }
  };

  const markTouched = (name: keyof Values & string) => {
    setTouched((current) => ({ ...current, [name]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "idle" });

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const nextErrors = getErrorMap(parsed.error.flatten().fieldErrors);
      setErrors(nextErrors);
      setTouched((current) => ({
        ...current,
        ...Object.keys(nextErrors).reduce<TouchedState<Values>>(
          (accumulator, field) => {
            accumulator[field as keyof Values & string] = true;
            return accumulator;
          },
          {},
        ),
      }));
      focusFirstError(nextErrors);
      return;
    }

    if (!onValidSubmit) {
      setStatus({
        type: "ready",
        message: "Validation passed. This form is ready for backend wiring.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onValidSubmit(parsed.data);
      setStatus({ type: result.type, message: result.message });
      if (result.resetValues) {
        setValues(initialValues);
        setTouched({});
        setErrors({});
      }
    } catch {
      setStatus({
        type: "error",
        message:
          "Something interrupted this request. Try again after the backend is connected.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorId = (name: keyof Values & string) => `${name}-error`;

  const getSharedProps = (name: keyof Values & string) => ({
    id: name,
    name,
    onBlur: () => markTouched(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? getErrorId(name) : undefined,
    ref: registerFieldRef(name),
  });

  const getInputProps = <TName extends keyof Values & string>(name: TName) => {
    return {
      ...getSharedProps(name),
      value: String(values[name] ?? ""),
      onChange: (
        event: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => setFieldValue(name, event.target.value as Values[TName]),
    };
  };

  const getCheckboxProps = <TName extends keyof Values & string>(
    name: TName,
  ) => {
    return {
      ...getSharedProps(name),
      checked: Boolean(values[name]),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setFieldValue(name, event.target.checked as Values[TName]),
    };
  };

  const visibleErrors = useMemo(() => {
    const nextErrors: ErrorState<Values> = {};

    for (const [name, message] of Object.entries(errors)) {
      if (touched[name as keyof Values & string] && typeof message === "string") {
        nextErrors[name as keyof Values & string] = message;
      }
    }

    return nextErrors;
  }, [errors, touched]);

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setStatus({ type: "idle" });
    setIsSubmitting(false);
  };

  return {
    values,
    errors: visibleErrors,
    status,
    isSubmitting,
    getErrorId,
    getCheckboxProps,
    getInputProps,
    handleSubmit,
    resetForm,
    setFieldValue,
  };
}
