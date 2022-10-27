import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { IconStyles } from "../utils/icon-styles";
import type { MarginProps } from "../utils/spacing";
import type { BoxProps } from "./Box";
import { Box } from "./Box";
import styles from "./Callout.module.css";
import type { FormButtonProps } from "./FormButton";
import { FormButton } from "./FormButton";

export type CalloutProps = BoxProps &
  PropsWithChildren<
    Omit<MarginProps, "ml" | "mr" | "mx"> & {
      className?: string;
      icon?: IconStyles;
    }
  >;

export const Callout = ({ children, icon, className, ...rest }: CalloutProps) => {
  return (
    <Box className={clsx("fr-callout", icon, className)} {...rest}>
      {children}
    </Box>
  );
};

export type CalloutTitleProps = PropsWithChildren<{
  className?: string;
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

export const CalloutTitle = ({ children, className, titleAs: HtmlTag = "p" }: CalloutTitleProps) => {
  return <HtmlTag className={clsx("fr-callout__title", styles.title, className)}>{children}</HtmlTag>;
};

export const CalloutContent = ({ children }: PropsWithChildren) => {
  return <div className={clsx("fr-callout__text")}>{children}</div>;
};

export type CalloutButtonProps = FormButtonProps;

export const CalloutButton = ({ ...props }: CalloutButtonProps) => {
  return <FormButton {...props} />;
};
