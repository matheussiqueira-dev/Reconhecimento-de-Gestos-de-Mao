import Link from "next/link";
import { ArrowLeft, CodeXml } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { SectionNav } from "./SectionNav";
import { PORTFOLIO_CASE_URL, PRODUCT_NAME, REPOSITORY_URL } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="ms-header">
      <div className="ms-container ms-header__inner">
        <Link href="/" className="ms-brand">
          <BrandMark />
          <span className="max-[479px]:sr-only">{PRODUCT_NAME}</span>
          <span className="ms-sr-only">, página inicial</span>
        </Link>
        <SectionNav />
        <nav aria-label="Projeto" className="ms-project-nav">
          <a href={PORTFOLIO_CASE_URL} className="ms-nav-link">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            Portfólio
          </a>
          <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="ms-nav-link">
            <CodeXml size={16} strokeWidth={1.75} aria-hidden="true" />
            Código<span className="ms-sr-only"> (abre em nova aba)</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
