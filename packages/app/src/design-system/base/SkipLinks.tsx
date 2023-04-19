import type { AnchorLink } from "@common/utils/url";
import type { PropsWithChildren } from "react";

/** @deprecated use react-dsfr */
export const SkipLinks = ({ children }: PropsWithChildren) => (
  <div className="fr-skiplinks">
    <nav className="fr-container" role="navigation" aria-label="Accès rapide">
      <ul className="fr-skiplinks__list">{children}</ul>
    </nav>
  </div>
);

export type SkipLinksItemProps = PropsWithChildren<{ href: AnchorLink }>;

export const SkipLinksItem = ({ children, href }: SkipLinksItemProps) => (
  <li>
    <a className="fr-link" href={href}>
      {children}
    </a>
  </li>
);
