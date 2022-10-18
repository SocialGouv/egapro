import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { Box } from "../base/Box";
import { ButtonGroup } from "../base/ButtonGroup";
import type { MarginProps } from "../utils/spacing";
import styles from "./FormLayout.module.css";

export type FormLayoutProps = PropsWithChildren<
  Omit<MarginProps, "mb" | "mt" | "mx"> & {
    className?: string;
  }
>;

export const FormLayout = ({ className, children, ...rest }: FormLayoutProps) => {
  return (
    <Box className={clsx(styles.form, className)} {...rest}>
      {children}
    </Box>
  );
};

export const FormLayoutButtonGroup = ({ children }: PropsWithChildren) => {
  return (
    <ButtonGroup inline="mobile-up" className={styles["btns-group"]}>
      {children}
    </ButtonGroup>
  );
};
