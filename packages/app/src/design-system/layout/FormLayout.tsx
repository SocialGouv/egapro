import { clsx } from "clsx";
import { forwardRef, type PropsWithChildren } from "react";

import { BoxRef } from "../base/Box";
import { type MarginProps } from "../utils/spacing";
import styles from "./FormLayout.module.css";

export type FormLayoutProps = PropsWithChildren<
  Omit<MarginProps, "mb" | "mt" | "mx"> & {
    className?: string;
  }
>;

export const FormLayout = forwardRef<HTMLDivElement, FormLayoutProps>(({ className, children, ...rest }, ref) => {
  return (
    <BoxRef ref={ref} className={clsx(styles.form, className)} {...rest}>
      {children}
    </BoxRef>
  );
});

FormLayout.displayName = "FormLayout";
