import clsx from "clsx";
import type { PropsWithChildren } from "react";

import styles from "./Tag.module.css";

export interface TagProps {
  variant?: "error" | "info" | "success" | "warning";
}
export const Tag = ({ children, variant }: PropsWithChildren<TagProps>) => (
  <div
    className={clsx(
      "fr-tag",
      variant === "info" && styles.info,
      variant === "success" && styles.success,
      variant === "warning" && styles.warning,
      variant === "error" && styles.error,
    )}
  >
    {children}
  </div>
);
