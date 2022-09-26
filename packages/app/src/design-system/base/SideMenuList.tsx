import type { PropsWithChildren } from "react";

export const SideMenuList = ({ children }: PropsWithChildren) => {
  return <ul className="fr-sidemenu__list">{children}</ul>;
};
