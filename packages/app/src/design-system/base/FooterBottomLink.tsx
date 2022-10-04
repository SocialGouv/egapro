import type { PropsWithChildren } from "react";

export type FooterBottomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const FooterBottomLink = ({ children, ...rest }: PropsWithChildren<FooterBottomLinkProps>) => {
  return (
    <a className="fr-footer__bottom-link" {...rest}>
      {children}
    </a>
  );
};
