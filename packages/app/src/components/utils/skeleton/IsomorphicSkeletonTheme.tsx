import { SkeletonTheme, type SkeletonThemeProps } from "react-loading-skeleton";

import { ClientSkeletonTheme } from "./client";

export const IsomorphicSkeletonTheme = ({ children, ...props }: SkeletonThemeProps) => (
  <SkeletonTheme {...props}>
    <ClientSkeletonTheme {...props}>{children}</ClientSkeletonTheme>
  </SkeletonTheme>
);
