import { type PropsWithChildren, type ReactElement } from "react";

import { SkeletonThemeContext } from "./SkeletonThemeContext";
import { type SkeletonStyleProps } from "./types";

export type SkeletonThemeProps = PropsWithChildren<SkeletonStyleProps>;

export function SkeletonTheme({ children, ...styleOptions }: SkeletonThemeProps): ReactElement {
  return <SkeletonThemeContext.Provider value={styleOptions}>{children}</SkeletonThemeContext.Provider>;
}
