import clsx from "clsx";
import type { PropsWithChildren } from "react";

import styles from "./Tag.module.css";

export const Tag = ({
  children,
  variant,
}: PropsWithChildren<{
  variant?: "error" | "info" | "success" | "warning";
}>) => (
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
