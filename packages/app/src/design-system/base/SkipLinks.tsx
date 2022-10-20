import type { PropsWithChildren } from "react";

export const SkipLinks = ({ children }: PropsWithChildren) => (
  <div className="fr-skiplinks">
    <nav className="fr-container" role="navigation" aria-label="Accès rapide">
      <ul className="fr-skiplinks__list">{children}</ul>
    </nav>
  </div>
);

export type SkipLinksItemProps = PropsWithChildren<{ href: string }>;

export const SkipLinksItem = ({ children, href }: SkipLinksItemProps) => (
  <li>
    <a className="fr-link" href={href}>
      {children}
    </a>
  </li>
);
