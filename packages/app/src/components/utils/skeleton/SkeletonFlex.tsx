import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { Skeleton, type SkeletonProps } from "@design-system/utils/client/skeleton";

import styles from "./SkeletonFlex.module.css";

/**
 * Skeleton component with `flex: 1` to its container.
 *
 * @see https://github.com/dvtng/react-loading-skeleton#the-skeleton-width-is-0-when-the-parent-has-display-flex
 */
export const SkeletonFlex = ({ containerClassName, ...props }: SkeletonProps) => {
  return <Skeleton {...props} containerClassName={cx(containerClassName, styles["flex-1"])} />;
};
