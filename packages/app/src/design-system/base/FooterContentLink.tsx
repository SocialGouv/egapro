import type { PropsWithChildren } from "react";

export type FooterContentLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const FooterContentLink = ({ children, ...rest }: PropsWithChildren<FooterContentLinkProps>) => {
  return (
    <a className="fr-footer__content-link" {...rest}>
      {children}
    </a>
  );
};
