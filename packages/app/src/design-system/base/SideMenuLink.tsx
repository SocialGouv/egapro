import clsx from "clsx";

export type SideMenuLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  isCurrent?: boolean;
};

export const SideMenuLink = ({ isCurrent, children, ...rest }: SideMenuLinkProps) => {
  return (
    <li className={clsx("fr-sidemenu__item", isCurrent && "fr-sidemenu__item--active")}>
      <a className="fr-sidemenu__link" aria-current={isCurrent ? "page" : undefined} target="_self" {...rest}>
        {children}
      </a>
    </li>
  );
};
