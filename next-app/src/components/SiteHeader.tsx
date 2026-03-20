"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SiteHeaderProps {
  /** Optional right-side slot (e.g. ModeToggle on compare page) */
  rightSlot?: React.ReactNode;
  /** Whether to use the NBALogo instead of text "GOAT" */
  logo?: React.ReactNode;
}

const navItems = [
  { href: "/compare", label: "对比" },
  { href: "/players", label: "球员" },
  { href: "/about", label: "关于" },
];

export default function SiteHeader({ rightSlot, logo }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          {logo ? (
            <Link href="/compare">{logo}</Link>
          ) : (
            <Link href="/" className="text-xl font-bold text-slate-800 hover:text-slate-600 transition-colors">
              GOAT
            </Link>
          )}
          <nav className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "text-slate-800 border-b-2 border-red-500 pb-0.5"
                      : "text-slate-400 hover:text-slate-600 transition-colors"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </div>
    </header>
  );
}
