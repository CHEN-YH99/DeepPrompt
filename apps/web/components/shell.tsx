import { NavLinks, type NavLinkItem } from "@/components/nav-links";
import { UserNav } from "@/components/user-nav";
import { getDictionary } from "@/lib/i18n";

type ShellProps = {
  children: React.ReactNode;
};

export function Shell({ children }: ShellProps) {
  const dict = getDictionary();
  const navItems: NavLinkItem[] = [
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
            <NavLinks items={navItems} />
            <UserNav
              confirmLogoutLabel={dict.nav.confirmLogout}
              initialNickname={null}
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
