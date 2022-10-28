import type { PropsWithChildren } from "react";
import { forwardRef } from "react";
import { Container } from "../layout/Container";

export const Footer = ({ children }: PropsWithChildren) => (
  <footer className="fr-footer" role="contentinfo" id="footer">
    <Container>{children}</Container>
  </footer>
);

export type FooterBodyProps = {
  description: string;
  items?: React.ReactNode;
  logo: React.ReactNode;
};

export const FooterBody = ({ children }: PropsWithChildren) => <div className="fr-footer__body">{children}</div>;

export const FooterBodyBrand = ({ children }: PropsWithChildren) => {
  return <div className="fr-footer__brand fr-enlarge-link">{children}</div>;
};

export const FooterBodyContent = ({ children }: PropsWithChildren) => {
  return <div className="fr-footer__content">{children}</div>;
};

export const FooterBodyContentDescription = ({ children }: PropsWithChildren) => {
  return <p className="fr-footer__content-desc">{children}</p>;
};

export const FooterBodyContentItems = ({ children }: PropsWithChildren) => {
  return <ul className="fr-footer__content-list">{children}</ul>;
};

export const FooterBodyItem = ({ children }: PropsWithChildren) => {
  return <li className="fr-footer__content-item">{children}</li>;
};

export const FooterBottom = ({ children }: PropsWithChildren) => {
  return (
    <div className="fr-footer__bottom">
      <ul className="fr-footer__bottom-list">{children}</ul>
      <div className="fr-footer__bottom-copy">
        <p>
          Sauf mention contraire, tous les contenus de ce site sont sous{" "}
          <a href="https://github.com/SocialGouv/egapro/blob/master/LICENSE" target="_blank" rel="noreferrer">
            licence Apache 2.0
          </a>
        </p>
      </div>
    </div>
  );
};

export const FooterBottomItem = ({ children }: PropsWithChildren) => {
  return <li className="fr-footer__bottom-item">{children}</li>;
};

export const FooterBottomLink = forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ children, ...rest }, ref) => {
    return (
      <a className="fr-footer__bottom-link" ref={ref} {...rest}>
        {children}
      </a>
    );
  },
);

FooterBottomLink.displayName = "FooterBottomLink";

export type FooterContentLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const FooterContentLink = ({ children, ...rest }: FooterContentLinkProps) => {
  return (
    <a className="fr-footer__content-link" {...rest}>
      {children}
    </a>
  );
};
