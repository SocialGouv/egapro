export type FooterBodyProps = {
  description: string;
  items?: React.ReactNode;
  logo: React.ReactNode;
};

export const FooterBody = ({ logo, description, items }: FooterBodyProps) => {
  return (
    <div className="fr-footer__body">
      <div className="fr-footer__brand fr-enlarge-link">{logo}</div>
      <div className="fr-footer__content">
        <p className="fr-footer__content-desc">{description}</p>
        {items && <ul className="fr-footer__content-list">{items}</ul>}
      </div>
    </div>
  );
};
