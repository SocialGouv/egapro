import type { PropsWithChildren } from "react";

export const SideMenuList = ({ children }: PropsWithChildren<Record<string, unknown>>) => {
  return <ul className="fr-sidemenu__list">{children}</ul>;
};
