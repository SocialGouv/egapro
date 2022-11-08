import { Disclosure } from "@headlessui/react";
import clsx from "clsx";
import type { CSSProperties, PropsWithChildren } from "react";
import { forwardRef, useState } from "react";

import { useCollapse } from "../hooks/useCollapse";
import styles from "./SideMenu.module.css";

export type SideMenuProps = PropsWithChildren<{
  buttonLabel: string;
}>;

export const SideMenu = ({ buttonLabel, children }: SideMenuProps) => {
  const [isExpanded, setExpanded] = useState(false);
  const wrapperId = "fr-sidemenu-wrapper";
  const { item, collapse } = useCollapse(wrapperId, isExpanded);
  return (
    <nav className="fr-sidemenu fr-sidemenu--sticky-full-height" aria-label="Menu latéral" role="navigation">
      <div className="fr-sidemenu__inner fr-py-12v">
        <button
          className="fr-sidemenu__btn"
          hidden
          aria-controls={wrapperId}
          aria-expanded={isExpanded}
          onClick={() => setExpanded(!isExpanded)}
        >
          {buttonLabel}
        </button>
        <div
          className={clsx("fr-collapse", isExpanded && "fr-collapse--expanded")}
          id={wrapperId}
          style={
            {
              "--collapse-max-height": item.stateHeight,
              "--collapse": collapse,
            } as CSSProperties
          }
        >
          {children}
        </div>
      </div>
    </nav>
  );
};

export const SideMenuTitle = ({ children }: PropsWithChildren) => <div className="fr-sidemenu__title">{children}</div>;

export const SideMenuList = ({ children }: PropsWithChildren) => <ul className="fr-sidemenu__list">{children}</ul>;

export type SideMenuLinkProps = PropsWithChildren<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isCurrent?: boolean;
  }
>;

export const SideMenuLink = forwardRef<HTMLAnchorElement, SideMenuLinkProps>(
  ({ isCurrent, children, ...rest }, ref) => (
    <li className={clsx("fr-sidemenu__item", isCurrent && "fr-sidemenu__item--active")}>
      <a className="fr-sidemenu__link" aria-current={isCurrent ? "page" : undefined} target="_self" {...rest} ref={ref}>
        {children}
      </a>
    </li>
  ),
);

SideMenuLink.displayName = "SideMenuLink";

export type SideMenuCollapseProps = PropsWithChildren<{
  isCurrent?: boolean;
  isExpandedDefault?: boolean;
  title: string;
}>;

export const SideMenuCollapse = ({
  isCurrent = false,
  isExpandedDefault = false,
  title,
  children,
}: SideMenuCollapseProps) => (
  <Disclosure as="li" className="fr-sidemenu__item" defaultOpen={isExpandedDefault}>
    <Disclosure.Button className={clsx("fr-sidemenu__btn", isCurrent && styles.current)}>{title}</Disclosure.Button>
    <Disclosure.Panel as="ul" className="fr-sidemenu__list">
      {children}
    </Disclosure.Panel>
  </Disclosure>
);
