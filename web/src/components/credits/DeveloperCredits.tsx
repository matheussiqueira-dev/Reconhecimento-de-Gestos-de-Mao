import { ExternalLink } from "lucide-react";

type DeveloperCreditsProps = {
  compact?: boolean;
};

export function DeveloperCredits({ compact = false }: DeveloperCreditsProps) {
  return (
    <div
      className={`surface flex flex-col justify-between gap-3 p-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center ${
        compact ? "shadow-none" : ""
      }`}
    >
      <p className="font-medium text-[var(--ink)]">
        Desenvolvido por Matheus Siqueira
      </p>
      <a
        href="https://www.matheussiqueira.dev"
        target="_blank"
        rel="noreferrer"
        className="focus-ring inline-flex w-fit items-center gap-2 rounded-md text-[var(--teal)] underline-offset-4 hover:underline"
      >
        www.matheussiqueira.dev
        <ExternalLink aria-hidden="true" size={15} />
      </a>
    </div>
  );
}
