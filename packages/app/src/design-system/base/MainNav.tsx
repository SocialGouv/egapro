import Link from "next/link";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";

export const MainNav = ({ children }: PropsWithChildren) => {
  return (
    <nav className="fr-nav" id="header-navigation" role="navigation" aria-label="Menu principal">
      <ul className="fr-nav__list">{children}</ul>
    </nav>
  );
};

export type MainNavItemProps = PropsWithChildren<{ href: string }>;

export const MainNavItem = ({ children, href }: MainNavItemProps) => {
  const router = useRouter();
  const currentRoute = router.pathname;
  return (
    <li className="fr-nav__item">
      <Link
        href={href}
        className="fr-nav__link"
        aria-current={href === `/${currentRoute.split("/")[1]}` ? "page" : undefined}
      >
        {children}
      </Link>
    </li>
  );
};
