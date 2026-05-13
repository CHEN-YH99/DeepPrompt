import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { UserNav } from "@/components/user-nav";

type ShellProps = {
  activePath: string;
  children: React.ReactNode;
};

export function Shell({ activePath, children }: ShellProps) {
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
            <UserNav
              confirmLogoutLabel={dict.nav.confirmLogout}
              loginLabel={dict.nav.login}
              logoutLabel={dict.nav.logout}
            />
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
