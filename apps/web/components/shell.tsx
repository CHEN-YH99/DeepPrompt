import { cookies } from "next/headers";

import { NavLinks, type NavLinkItem } from "@/components/nav-links";
import { UserNav } from "@/components/user-nav";
import { fetchCurrentUser } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

type ShellProps = {
  children: React.ReactNode;
};

export async function Shell({ children }: ShellProps) {
  const dict = getDictionary();
  const navItems: NavLinkItem[] = [
    { href: "/", label: dict.nav.home },
    { href: "/search", label: dict.nav.search },
    { href: "/models", label: dict.nav.models },
    { href: "/publish", label: dict.nav.publish },
    { href: "/me/prompts", label: dict.nav.myPrompts }
  ];

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const currentUser = await fetchCurrentUser(accessToken);
  // 与 /api/auth/session 保持一致：admin/moderator 的展示昵称统一覆盖
  const initialNickname = currentUser
    ? currentUser.role === "admin" || currentUser.role === "moderator"
      ? "小灰超管"
      : currentUser.nickname
    : null;

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
              initialNickname={initialNickname}
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
