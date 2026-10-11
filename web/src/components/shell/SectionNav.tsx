"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/", label: "Início" },
  { href: "/demo", label: "Demo" },
  { href: "/dashboard", label: "Painel" },
  { href: "/about", label: "Como funciona" },
] as const;

export function SectionNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Seções" className="ms-nav">
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="ms-nav-link"
          aria-current={pathname === section.href ? "page" : undefined}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
