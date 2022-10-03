import type { PropsWithChildren } from "react";
import { Children } from "react";

import type { AuthorizedChildType } from "../utils/compatible-components";
import { compatibleComponents } from "../utils/compatible-components";

export const ContentWithAside = ({ children }: PropsWithChildren<Record<string, unknown>>) => {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("ContentWithAside", ["ContentWithAsideSideMenu", "ContentWithAsideMain"], arrayOfChildren);
  const sidemenu = arrayOfChildren.filter(
    child => (child as AuthorizedChildType).type.name === "ContentWithAsideSideMenu",
  );
  const main = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "ContentWithAsideMain");
  return (
    <div className="fr-grid-row">
      {sidemenu}
      {main}
    </div>
  );
};

ContentWithAside.SideMenu = function ContentWithAsideSideMenu({
  children,
}: PropsWithChildren<Record<string, unknown>>) {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("ContentWithAsideSideMenu", ["SideMenu"], arrayOfChildren);
  const sidemenu = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "SideMenu");
  return <div className="fr-col-12 fr-col-md-4">{sidemenu}</div>;
};

ContentWithAside.Main = function ContentWithAsideMain({ children }: PropsWithChildren<Record<string, unknown>>) {
  return <div className="fr-col-12 fr-col-md-8 fr-py-12v">{children}</div>;
};
