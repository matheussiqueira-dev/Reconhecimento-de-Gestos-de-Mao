import Link from "next/link";
import { Activity, BarChart3, Camera, Hand, Info } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Hand },
  { href: "/demo", label: "Demo", icon: Camera },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/about", label: "About", icon: Info },
];

export function Navigation() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/92 backdrop-blur">
      <nav className="content-shell flex min-h-16 items-center justify-between gap-4 py-3">
        <Link
          href="/"
          className="focus-ring flex items-center gap-3 rounded-md text-sm font-semibold text-[var(--ink)]"
        >
          <span className="grid size-10 place-items-center rounded-md bg-[var(--teal)] text-white">
            <Activity aria-hidden="true" size={20} />
          </span>
          <span className="hidden sm:inline">Gesture Dashboard</span>
        </Link>
        <div className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)]"
              >
                <Icon aria-hidden="true" size={17} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
