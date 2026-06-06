/**
 * Step indicator component for the multi-step borrow flow.
 * Displays progress through the credential verification, terms configuration, and checkout steps.
 */

import { BORROW_STEPS } from "@/lib/constants";

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between mb-12 max-w-xl mx-auto px-4">
      {BORROW_STEPS.map((label, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
          {i > 0 && (
            <div
              className={`absolute top-2.5 right-1/2 left-[-50%] h-[1px] -z-10 transition-colors duration-500 ${
                i <= currentStep - 1 ? "bg-[var(--color-sage-dark)]" : "bg-[var(--bone-dark)] opacity-20"
              }`}
            />
          )}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono border transition-all duration-500 ${
              i <= currentStep - 1
                ? "bg-[var(--color-sage-dark)] border-[var(--color-sage-dark)] text-white scale-110 shadow-sm"
                : "bg-[var(--glass-bg)] border-[var(--bone-dark)] text-[var(--ink-muted)] opacity-50"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-[9px] font-mono tracking-wider transition-colors duration-300 ${
              i <= currentStep - 1 ? "text-[var(--ink)] font-bold" : "text-[var(--ink-muted)] opacity-30"
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
