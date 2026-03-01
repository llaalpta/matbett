"use client";

import {
  CircleDollarSign,
  Gift,
  LayoutDashboard,
  Percent,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: typeof LayoutDashboard;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "General",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Operativa",
    items: [
      {
        href: "/bets",
        label: "Apuestas",
        icon: ReceiptText,
      },
      {
        href: "/deposits",
        label: "Depósitos",
        icon: CircleDollarSign,
      },
      {
        href: "/bookmaker-accounts",
        label: "Cuentas",
        icon: WalletCards,
      },
    ],
  },
  {
    label: "Promociones",
    items: [
      {
        href: "/promotions",
        label: "Promociones",
        icon: Percent,
      },
      {
        href: "/rewards",
        label: "Recompensas",
        shortLabel: "Rewards",
        icon: Gift,
      },
      {
        href: "/qualify-conditions",
        label: "Condiciones de calificación",
        shortLabel: "QC",
        icon: ShieldCheck,
      },
    ],
  },
];

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveItem(pathname: string) {
  for (const group of navigationGroups) {
    const item = group.items.find((candidate) =>
      isNavigationItemActive(pathname, candidate.href)
    );

    if (item) {
      return item;
    }
  }

  return null;
}

function NavigationLink({
  item,
  pathname,
  mobile = false,
}: {
  item: NavigationItem;
  pathname: string;
  mobile?: boolean;
}) {
  const isActive = isNavigationItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-md border text-sm transition-colors",
        mobile
          ? "h-9 shrink-0 px-3"
          : "px-3 py-2",
        isActive
          ? "border-primary/20 bg-primary/10 text-primary font-semibold"
          : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{mobile ? item.shortLabel ?? item.label : item.label}</span>
    </Link>
  );
}

export function AppNavigation() {
  const pathname = usePathname();
  const activeItem = findActiveItem(pathname);

  return (
    <>
      <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold tracking-[0.06em] uppercase">
            MatBett
          </Link>
          <span className="text-muted-foreground text-xs font-medium">
            {activeItem?.label ?? "MatBett"}
          </span>
        </div>
        <div className="border-t px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navigationGroups.flatMap((group) =>
              group.items.map((item) => (
                <NavigationLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  mobile
                />
              ))
            )}
          </div>
        </div>
      </header>

      <aside className="bg-sidebar hidden border-r lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b px-5 py-5">
          <Link href="/" className="block">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              MatBett
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              Control operativo
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-6 px-4 py-5">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-muted-foreground px-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavigationLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
