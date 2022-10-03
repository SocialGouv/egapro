import type { PropsWithChildren } from "react";

export type ContentWithAsideProps = PropsWithChildren<Record<never, never>>;

export const ContentWithAside = ({ children }: ContentWithAsideProps) => <div className="fr-grid-row">{children}</div>;

export type ContentWithAsideSideMenuProps = PropsWithChildren<Record<never, never>>;

export const ContentWithAsideSideMenu = ({ children }: ContentWithAsideSideMenuProps) => (
  <div className="fr-col-12 fr-col-md-4">{children}</div>
);

export type ContentWithAsideMainProps = PropsWithChildren<Record<never, never>>;

export const ContentWithAsideMain = ({ children }: ContentWithAsideMainProps) => (
  <div className="fr-col-12 fr-col-md-8 fr-py-12v">{children}</div>
);
