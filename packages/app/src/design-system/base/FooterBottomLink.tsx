export type FooterBottomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const FooterBottomLink = ({ children, ...rest }: FooterBottomLinkProps) => {
  return (
    <a className="fr-footer__bottom-link" {...rest}>
      {children}
    </a>
  );
};
