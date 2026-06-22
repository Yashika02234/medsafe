"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/dashboard",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/medicines",
    label: "Cabinet",
    icon: CabinetIcon,
  },
  null, // center FAB
  {
    href: "/interactions",
    label: "Alerts",
    isAlerts: true,
    icon: AlertsIcon,
  },
  {
    href: "/family",
    label: "Family",
    icon: FamilyIcon,
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="print:hidden fixed bottom-0 left-0 right-0 z-50 h-[82px] bg-[var(--ms-surf)] border-t border-[var(--ms-bord)] max-w-lg mx-auto"
    >
      <ul className="flex items-start justify-around h-full px-2 pt-[10px]">
        {TABS.map((tab) => {
          if (tab === null) {
            return (
              <li key="add" className="flex-1 flex justify-center relative -top-[14px]">
                <Link
                  href="/scan"
                  aria-label="Scan medicine"
                  className="w-[54px] h-[54px] rounded-full bg-[var(--ms-acc)] flex items-center justify-center no-underline nav-fab-shadow"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </Link>
              </li>
            );
          }

          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const isAlerts = "isAlerts" in tab && !!tab.isAlerts;
          const activeColor = isAlerts ? "text-[#F4645E]" : "text-[var(--ms-acc)]";
          const inactiveColor = "text-[var(--ms-txt3)]";

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-[3px] w-full no-underline py-[2px]"
              >
                <tab.icon active={active} isAlerts={isAlerts} />
                <span className={cn("text-[10px]", active ? cn("font-semibold", activeColor) : cn("font-normal", inactiveColor))}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean; isAlerts?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#4F8EFF" : "rgba(238,242,255,0.3)"}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function CabinetIcon({ active }: { active: boolean; isAlerts?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#4F8EFF" : "rgba(238,242,255,0.3)"}>
      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
    </svg>
  );
}

function AlertsIcon({ active }: { active: boolean; isAlerts?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F4645E" : "rgba(238,242,255,0.3)"}>
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function FamilyIcon({ active }: { active: boolean; isAlerts?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#4F8EFF" : "rgba(238,242,255,0.3)"}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}
