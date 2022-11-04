import type { PropsWithChildren } from "react";

export const ContentWithAside = ({ children }: PropsWithChildren) => <div className="fr-grid-row">{children}</div>;

export const ContentWithAsideSideMenu = ({ children }: PropsWithChildren) => (
  <div className="fr-col-12 fr-col-md-4">{children}</div>
);

export const ContentWithAsideMain = ({ children }: PropsWithChildren) => (
  <div className="fr-col-12 fr-col-md-8 fr-py-12v">{children}</div>
);
