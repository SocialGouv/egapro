import type { FunctionComponent } from "react";

export const FooterBodyItem: FunctionComponent = ({ children }) => {
  return <li className="fr-footer__content-item">{children}</li>;
};
