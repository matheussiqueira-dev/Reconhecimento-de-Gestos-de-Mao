import { ShieldCheck } from "lucide-react";
import { REQUIRED_PRIVACY_NOTICE } from "@/lib/gestures";

export function PrivacyNotice() {
  return (
    <section className="surface border-l-4 border-l-[var(--teal)] p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck aria-hidden="true" className="mt-1 text-[var(--teal)]" />
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Privacidade</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {REQUIRED_PRIVACY_NOTICE}
          </p>
        </div>
      </div>
    </section>
  );
}
