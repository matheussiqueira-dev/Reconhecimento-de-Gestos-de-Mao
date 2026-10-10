"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid max-w-xl gap-4 py-12">
      <h1 className="text-h1">Algo deu errado nesta página</h1>
      <p className="text-fg-secondary">
        Um erro inesperado interrompeu a página. Tente de novo; se continuar, volte ao início.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="ms-btn ms-btn--primary" onClick={reset}>
          <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
          Tentar novamente
        </button>
        <Link href="/" className="ms-btn ms-btn--secondary">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
