import { clsx } from "clsx";
import NextLink from "next/link";
import type { PropsWithChildren } from "react";
import { useState } from "react";

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
    {href ? (
      <NextLink href={href} passHref>
        <a className="fr-breadcrumb__link">{children}</a>
      </NextLink>
    ) : (
      <a aria-current={isCurrent && "page"} className="fr-breadcrumb__link">
        {children}
      </a>
    )}
  </li>
);
