"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLinkItem = {
  href: string;
  label: string;
};

type NavLinksProps = {
  items: NavLinkItem[];
};

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items }: NavLinksProps) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          className="nav-link"
          data-active={isActive(pathname, item.href)}
          href={item.href}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}
