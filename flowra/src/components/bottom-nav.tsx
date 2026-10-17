"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, HeartPulse, Home, ShoppingBag, Stethoscope, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { useCart } from "@/lib/client/cart";
import { cn } from "@/lib/utils";

const MOBILE = [
  { href: "/home", label: "Today", icon: Home },
  { href: "/timeline", label: "Calendar", icon: CalendarDays },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/care", label: "Care", icon: HeartPulse },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
];

const DESKTOP = [
  { href: "/home", label: "Today" },
  { href: "/log", label: "Log" },
  { href: "/timeline", label: "Calendar" },
  { href: "/insights", label: "Insights" },
  { href: "/care", label: "Health patterns" },
  { href: "/doctors", label: "Doctors" },
  { href: "/learn", label: "Learn" },
  { href: "/shop", label: "Shop" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/care") return pathname.startsWith("/care");
  if (href === "/insights") return pathname.startsWith("/insights") || pathname.startsWith("/summary");
  if (href === "/doctors") return pathname.startsWith("/doctors") || pathname.startsWith("/appointments");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Top header (all sizes) with full navigation on desktop. */
export function AppHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-sand-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/home" aria-label="Flowra home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
          {DESKTOP.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive(pathname, t.href) ? "page" : undefined}
              className={cn("rounded-md px-3 py-2 text-sm font-medium", isActive(pathname, t.href) ? "bg-plum-50 text-plum-700" : "text-sand-600 hover:bg-sand-100 hover:text-sand-800")}
            >
              {t.label}
              {t.href === "/shop" && count > 0 && <span className="ml-1 rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-white">{count}</span>}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link href="/learn" aria-label="Learn" className="flex h-11 w-11 items-center justify-center rounded-full text-sand-600 hover:bg-sand-100 lg:hidden">
            <BookOpen className="h-5 w-5" />
          </Link>
          <Link href="/doctors" aria-label="Doctors" className="flex h-11 w-11 items-center justify-center rounded-full text-sand-600 hover:bg-sand-100 lg:hidden">
            <Stethoscope className="h-5 w-5" />
          </Link>
          <Link href="/profile" aria-label="Profile and settings" aria-current={pathname.startsWith("/profile") ? "page" : undefined} className="flex h-11 w-11 items-center justify-center rounded-full text-sand-600 hover:bg-sand-100">
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar on phones and tablets. */
export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  return (
    <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg">
        {MOBILE.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-medium", active ? "text-plum-600" : "text-sand-600 hover:text-sand-800")}>
                <Icon className="h-6 w-6" aria-hidden />
                {label}
                {href === "/shop" && count > 0 && (
                  <span className="absolute right-[22%] top-1.5 rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-white" aria-label={`${count} in cart`}>
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
