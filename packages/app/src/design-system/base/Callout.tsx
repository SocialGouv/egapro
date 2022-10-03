import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { iconStyles } from "../utils/icon-styles";
import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";
import styles from "./Callout.module.css";
import type { FormButtonProps } from "./FormButton";
import { FormButton } from "./FormButton";

export type CalloutProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    className?: string;
    icon?: iconStyles;
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

export type CalloutContentProps = PropsWithChildren<Record<never, never>>;

export const CalloutContent = ({ children }: CalloutContentProps) => {
  return <div className={clsx("fr-callout__text")}>{children}</div>;
};

export type CalloutButtonProps = FormButtonProps;

export const CalloutButton = ({ ...props }: CalloutButtonProps) => {
  return <FormButton {...props} />;
};
