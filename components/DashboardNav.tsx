"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardNav({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const pathname = usePathname();

  const nav = [
    { href: `/dashboard/${workspaceId}`, label: "Chat" },
    { href: `/dashboard/${workspaceId}/documents`, label: "Documents" },
    { href: `/dashboard/${workspaceId}/tools`, label: "Tool Log" },
  ];

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent font-medium text-foreground"
                : "text-foreground/80 hover:bg-accent hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}