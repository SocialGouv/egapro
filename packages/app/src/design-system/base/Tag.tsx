import { clsx } from "clsx";
import type { PropsWithChildren } from "react";

import styles from "./Tag.module.css";

export type TagProps = PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & {
  variant?: "error" | "info" | "success" | "warning";
};

/** @deprecated use react-dsfr */
export const Tag = ({ children, variant, ...rest }: TagProps) => (
  <div {...rest}>
    <div
      className={clsx(
        "fr-tag",
        variant === "info" && styles.info,
        variant === "success" && styles.success,
        variant === "warning" && styles.warning,
        variant === "error" && styles.error,
      )}
      {...rest}
    >
      {children}
    </div>
  </div>
);
