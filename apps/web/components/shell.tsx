import Link from "next/link";

const navItems = [
  { href: "/", label: "HOME" },
  { href: "/search", label: "SEARCH" },
  { href: "/publish", label: "PUBLISH" },
  { href: "/me/prompts", label: "MY PROMPTS" },
  { href: "/login", label: "LOGIN" }
];

type ShellProps = {
  activePath: string;
  children: React.ReactNode;
};

export function Shell({ activePath, children }: ShellProps) {
  return (
    <>
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">[ ARCHIVE / DEEPPROMPT ]</div>
            <div className="brand-name">DEEPPROMPT</div>
            <div className="brand-sub">
              SWISS GRID / TACTICAL TELEMETRY / PROMPT INTELLIGENCE NETWORK
            </div>
          </div>
          <nav className="nav-strip" aria-label="Primary navigation">
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
          </nav>
          <div className="status-box">
            <div>NODE / WEB-01</div>
            <div className="status-live">STATUS / ONLINE</div>
            <div>BUILD GOAL / MVP WEEK 12</div>
          </div>
        </header>
      </div>
      {children}
      <div className="shell">
        <footer className="footer-strip">
          <div>DEEPPROMPT / AI IMAGE PROMPT ARCHIVE / MODEL-AGNOSTIC COMMUNITY PLATFORM</div>
          <div>TACTICAL MODE / DARK ONLY</div>
          <div>REV / 2026.05.04</div>
        </footer>
      </div>
    </>
  );
}
