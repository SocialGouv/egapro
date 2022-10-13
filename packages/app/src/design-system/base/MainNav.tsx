import Link from "next/link";
import type { PropsWithChildren } from "react";

export type MainNavProps = PropsWithChildren<Record<never, never>>;

export const MainNav = ({ children }: MainNavProps) => {
  return (
    <nav className="fr-nav" id="header-navigation" role="navigation" aria-label="Menu principal">
      <ul className="fr-nav__list">{children}</ul>
    </nav>
  );
};

export type MainNavItemProps = PropsWithChildren<{ href: string; isCurrent?: boolean }>;

export const MainNavItem = ({ children, href, isCurrent }: MainNavItemProps) => {
  return (
    <li className="fr-nav__item">
      <Link href={href}>
        <a className="fr-nav__link" aria-current={isCurrent && "page"}>
          {children}
        </a>
      </Link>
    </li>
  );
};
