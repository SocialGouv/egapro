import { createContext } from "react";

import { type SkeletonStyleProps } from "./types";

/**
 * @internal
 */
export const SkeletonThemeContext = createContext<SkeletonStyleProps>({});
