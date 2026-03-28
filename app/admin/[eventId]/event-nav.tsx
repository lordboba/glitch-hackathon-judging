"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

export default function EventNav({
  eventId,
  items,
}: {
  eventId: string;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const base = `/admin/${eventId}`;

  return (
    <nav className="event-nav">
      {items.map((item) => {
        const fullHref = `${base}${item.href}`;
        const isActive =
          item.href === ""
            ? pathname === base || pathname === `${base}/`
            : pathname.startsWith(fullHref);

        return (
          <Link
            key={item.href}
            href={fullHref}
            className={isActive ? "active" : ""}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
