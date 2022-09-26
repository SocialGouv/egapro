import type { PropsWithChildren } from "react";

export const FooterBottomItem = ({ children }: PropsWithChildren) => {
  return <li className="fr-footer__bottom-item">{children}</li>;
};
