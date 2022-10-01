import type { PropsWithChildren } from "react";

export const FooterBottomItem = ({ children }: PropsWithChildren<Record<string, unknown>>) => {
  return <li className="fr-footer__bottom-item">{children}</li>;
};
