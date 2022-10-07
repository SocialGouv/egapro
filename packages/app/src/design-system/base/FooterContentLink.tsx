export type FooterContentLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const FooterContentLink = ({ children, ...rest }: FooterContentLinkProps) => {
  return (
    <a className="fr-footer__content-link" {...rest}>
      {children}
    </a>
  );
};
