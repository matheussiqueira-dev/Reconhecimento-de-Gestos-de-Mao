import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid max-w-xl gap-4 py-12">
      <h1 className="text-h1">Página não encontrada</h1>
      <p className="text-fg-secondary">O endereço pode ter mudado. As páginas da demo estão no menu acima.</p>
      <p>
        <Link href="/" className="ms-btn ms-btn--primary">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
