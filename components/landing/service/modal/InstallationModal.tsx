"use client";

import { ChevronLeft, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";

import StepOne from "./steps/StepOne";
import StepTwo from "./steps/StepTwo";
import StepThree from "./steps/StepThree";
import StepFour from "./steps/StepFour";
import StepFive from "./steps/StepFive";
import type { AddressChoice, InstallationType } from "./steps/types";

function StepBar({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex justify-center gap-2" role="presentation">
      {Array.from({ length: total }).map((_, index) => (
        <div
          className={`h-1 w-12 rounded-full transition-colors ${
            index <= step - 1 ? "bg-primary" : "bg-slate-200"
          }`}
          key={index}
        />
      ))}
    </div>
  );
}

export default function InstallationModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const initialDate = useMemo(() => Math.min(new Date().getDate() + 3, 28), []);
  const [step, setStep] = useState(1);
  const [installType, setInstallType] = useState<InstallationType>("system");
  const [address, setAddress] = useState<AddressChoice>("primary");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState("11:00 AM");

  const showBack = step > 1 && step < 5;
  const showProgress = step < 5;

  function next() {
    setStep((current) => current + 1);
  }

  function back() {
    setStep((current) => current - 1);
  }

  return (
    <Modal
      className={`overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.2)] ${
        step === 4 ? "max-w-[580px]" : "max-w-[780px]"
      }`}
      description="Preview and validate an installation request draft without sending it to a live backend."
      onClose={onClose}
      title="Installation request preview"
    >
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          {showBack ? (
            <button
              className="flex items-center gap-1 text-sm font-semibold text-slate-700 transition-opacity hover:opacity-80"
              onClick={back}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} /> Back
            </button>
          ) : (
            <div className="w-15" />
          )}

          {showProgress ? <StepBar step={step} /> : <div />}

          <button
            aria-label="Close installation request preview"
            className="flex size-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="px-7 pb-8 pt-7">
          {step === 1 ? (
            <StepOne
              onNext={next}
              onSelect={setInstallType}
              selected={installType}
            />
          ) : null}
          {step === 2 ? (
            <StepTwo
              installType={installType}
              onNext={next}
              onSelect={setAddress}
              selected={address}
            />
          ) : null}
          {step === 3 ? (
            <StepThree
              installType={installType}
              onNext={next}
              onSelectDate={setSelectedDate}
              onSelectTime={setSelectedTime}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          ) : null}
          {step === 4 ? (
            <StepFour
              installType={installType}
              onConfirm={next}
              selectedAddress={address}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          ) : null}
          {step === 5 ? (
            <StepFive
              onDashboard={onClose}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
