import type { PropsWithChildren } from "react";
import type { EmptyObject } from "@common/utils/types";

export type ContentWithAsideProps = PropsWithChildren<EmptyObject>;

export const ContentWithAside = ({ children }: ContentWithAsideProps) => <div className="fr-grid-row">{children}</div>;

export type ContentWithAsideSideMenuProps = PropsWithChildren<EmptyObject>;

export const ContentWithAsideSideMenu = ({ children }: ContentWithAsideSideMenuProps) => (
  <div className="fr-col-12 fr-col-md-4">{children}</div>
);

export type ContentWithAsideMainProps = PropsWithChildren<EmptyObject>;

export const ContentWithAsideMain = ({ children }: ContentWithAsideMainProps) => (
  <div className="fr-col-12 fr-col-md-8 fr-py-12v">{children}</div>
);
