import type { FunctionComponent } from "react";

export const SideMenuList: FunctionComponent = ({ children }) => {
  return <ul className="fr-sidemenu__list">{children}</ul>;
};
