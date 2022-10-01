import type { PropsWithChildren } from "react";

export const FooterBodyItem = ({ children }: PropsWithChildren<Record<string, unknown>>) => {
  return <li className="fr-footer__content-item">{children}</li>;
};
