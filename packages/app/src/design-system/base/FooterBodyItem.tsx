import type { PropsWithChildren } from "react";

export const FooterBodyItem = ({ children }: PropsWithChildren) => {
  return <li className="fr-footer__content-item">{children}</li>;
};
