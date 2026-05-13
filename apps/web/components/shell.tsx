import Link from "next/link";

import { getDictionary } from "@/lib/i18n";

type ShellProps = {
  activePath: string;
  children: React.ReactNode;
  nickname?: string;
};

export function Shell({ activePath, children, nickname }: ShellProps) {
  const dict = getDictionary();
  const navItems: Array<{ href: string; label: string }> = [
    { href: "/", label: dict.nav.home },
    { href: "/search", label: dict.nav.search },
    { href: "/models", label: dict.nav.models },
    { href: "/publish", label: dict.nav.publish },
    { href: "/me/prompts", label: dict.nav.myPrompts }
  ];

  return (
    <>
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">{dict.common.brandKicker}</div>
            <div className="brand-name">{dict.common.brand}</div>
            <div className="brand-sub">{dict.common.brandSub}</div>
          </div>
          <nav className="nav-strip" aria-label={dict.nav.home}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="nav-link"
                data-active={activePath === item.href}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
            {nickname ? (
              <Link className="nav-link nav-user" href="/me/prompts">
                {nickname}
              </Link>
            ) : (
              <Link
                className="nav-link"
                data-active={activePath === "/login"}
                href="/login"
              >
                {dict.nav.login}
              </Link>
            )}
          </nav>
        </header>
      </div>
      {children}
      <div className="shell">
        <footer className="footer-strip">
          <div>{dict.common.footerLine}</div>
        </footer>
      </div>
    </>
  );
}
