import type { AnchorLink } from "@common/utils/url";
import { clsx } from "clsx";
import type { PropsWithChildren } from "react";

export const Summary = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <nav className={clsx("fr-summary", className)} role="navigation" aria-labelledby="fr-summary-title">
    <p className="fr-summary__title" id="fr-summary-title">
      Sommaire
    </p>
    <ol className="fr-summary__list">{children}</ol>
  </nav>
);

export const SummaryLink = ({ children, href }: PropsWithChildren<{ href: AnchorLink }>) => (
  <li>
    <a className="fr-summary__link" href={href}>
      {children}
    </a>
  </li>
);
