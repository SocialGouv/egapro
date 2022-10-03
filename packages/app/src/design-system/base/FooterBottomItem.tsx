import type { PropsWithChildren } from "react";

export const FooterBottomItem = ({ children }: PropsWithChildren<Record<never, never>>) => {
  return <li className="fr-footer__bottom-item">{children}</li>;
};
