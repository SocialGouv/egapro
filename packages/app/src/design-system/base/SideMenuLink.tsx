import clsx from "clsx";
import type { FunctionComponent } from "react";

export type SideMenuLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  isCurrent?: boolean;
};

export const SideMenuLink: FunctionComponent<SideMenuLinkProps> = ({ isCurrent, children, ...rest }) => {
  return (
    <li className={clsx("fr-sidemenu__item", isCurrent && "fr-sidemenu__item--active")}>
      <a className="fr-sidemenu__link" aria-current={isCurrent ? "page" : undefined} target="_self" {...rest}>
        {children}
      </a>
    </li>
  );
};
