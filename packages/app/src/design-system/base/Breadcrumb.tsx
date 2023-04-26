import { clsx } from "clsx";
import { type PropsWithChildren } from "react";
import { useState } from "react";

import { NextLinkOrA } from "../utils/NextLinkOrA";

export const Breadcrumb = ({ children }: PropsWithChildren) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
      <button
        className="fr-breadcrumb__button"
        aria-expanded={isExpanded}
        aria-controls="breadcrumb"
        onClick={() => setIsExpanded(true)}
      >
        Voir le fil d’Ariane
      </button>
      <div className={clsx(!isExpanded && "fr-collapse")} id="breadcrumb">
        <ol className="fr-breadcrumb__list">{children}</ol>
      </div>
    </nav>
  );
};

export type BreadcrumbItemProps = PropsWithChildren<{ href?: string; isCurrent?: boolean }>;

export const BreadcrumbItem = ({ href, isCurrent, children }: BreadcrumbItemProps) => (
  <li>
    <NextLinkOrA className="fr-breadcrumb__link" href={href || undefined} aria-current={!href && isCurrent && "page"}>
      {children}
    </NextLinkOrA>
  </li>
);
