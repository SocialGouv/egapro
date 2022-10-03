import { Disclosure } from "@headlessui/react";
import clsx from "clsx";
import type { CSSProperties, PropsWithChildren } from "react";
import { Children } from "react";
import { useState } from "react";

import { useCollapse } from "../hooks/useCollapse";
import type { AuthorizedChildType } from "../utils/compatible-components";
import { compatibleComponents } from "../utils/compatible-components";
import styles from "./SideMenu.module.css";

export type SideMenuProps = PropsWithChildren<{
  buttonLabel: string;
  className?: string;
}>;

export const SideMenu = ({ buttonLabel, children, className }: SideMenuProps) => {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("SideMenu", ["SideMenuList", "SideMenuTitle"], arrayOfChildren);
  const filteredChildren = arrayOfChildren.filter(
    child => (child as AuthorizedChildType).type.name === "SideMenuList" || "SideMenuTitle",
  );
  const [isExpanded, setExpanded] = useState(false);
  const wrapperId = "fr-sidemenu-wrapper";
  const { item, collapse } = useCollapse(wrapperId, isExpanded);
  return (
    <nav className={clsx("fr-sidemenu", className)} aria-label="Menu latéral">
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
          {filteredChildren}
        </div>
      </div>
    </nav>
  );
};

SideMenu.Title = function SideMenuTitle({ children }: PropsWithChildren<Record<string, unknown>>) {
  return <div className="fr-sidemenu__title">{children}</div>;
};

SideMenu.List = function SideMenuList({ children }: PropsWithChildren<Record<string, unknown>>) {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("SideMenuList", ["SideMenuLink", "SideMenuCollapse"], arrayOfChildren);
  const filteredChildren = arrayOfChildren.filter(
    child => (child as AuthorizedChildType).type.name === "SideMenuLink" || "SideMenuCollapse",
  );
  return <ul className="fr-sidemenu__list">{filteredChildren}</ul>;
};

SideMenu.Link = function SideMenuLink({
  isCurrent,
  children,
  ...rest
}: PropsWithChildren<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isCurrent?: boolean;
  }
>) {
  return (
    <li className={clsx("fr-sidemenu__item", isCurrent && "fr-sidemenu__item--active")}>
      <a className="fr-sidemenu__link" aria-current={isCurrent ? "page" : undefined} target="_self" {...rest}>
        {children}
      </a>
    </li>
  );
};

SideMenu.Collapse = function SideMenuCollapse({
  isCurrent = false,
  isExpandedDefault = false,
  title,
  children,
}: PropsWithChildren<{
  isCurrent?: boolean;
  isExpandedDefault?: boolean;
  title: string;
}>) {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("SideMenuCollapse", ["SideMenuLink"], arrayOfChildren);
  const link = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "SideMenuLink");
  return (
    <Disclosure as="li" className="fr-sidemenu__item" defaultOpen={isExpandedDefault}>
      <Disclosure.Button className={clsx("fr-sidemenu__btn", isCurrent && styles.current)}>{title}</Disclosure.Button>
      <Disclosure.Panel as="ul" className="fr-sidemenu__list">
        {link}
      </Disclosure.Panel>
    </Disclosure>
  );
};
