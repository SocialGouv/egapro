import type { FunctionComponent } from "react";

export type FooterContentLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const FooterContentLink: FunctionComponent<FooterContentLinkProps> = ({ children, ...rest }) => {
  return (
    <a className="fr-footer__content-link" {...rest}>
      {children}
    </a>
  );
};
