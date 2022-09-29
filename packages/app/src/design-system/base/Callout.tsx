import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { Children } from "react";

import { compatibleComponents } from "../utils/compatible-components";
import type { AuthorizedChildType } from "../utils/compatible-components";
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

export const Callout = ({ children, className, icon, ...rest }: CalloutProps) => {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("Callout", ["CalloutButton", "CalloutTitle", "CalloutContent"], arrayOfChildren);
  const title = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "CalloutTitle");
  const content = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "CalloutContent");
  const button = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "CalloutButton");
  return (
    <Box className={clsx("fr-callout", icon, className)} {...rest}>
      {title}
      {content}
      {button}
    </Box>
  );
};

type CalloutTitleProps = PropsWithChildren<{
  className?: string;
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

Callout.Title = function CalloutTitle({ children, className, titleAs: HtmlTag = "p" }: CalloutTitleProps) {
  return <HtmlTag className={clsx("fr-callout__title", styles.title, className)}>{children}</HtmlTag>;
};

type CalloutDescriptionProps = PropsWithChildren<{
  className?: string;
}>;

Callout.Content = function CalloutContent({ children, className }: CalloutDescriptionProps) {
  return <div className={clsx("fr-callout__text", className)}>{children}</div>;
};

Callout.Button = function CalloutButton({ ...props }: FormButtonProps) {
  return <FormButton {...props} />;
};
