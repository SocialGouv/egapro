import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { IconStyles } from "../utils/icon-styles";
import styles from "./Callout.module.css";

export type CalloutProps = PropsWithChildren<{
  className?: string;
  icon?: IconStyles;
}>;

export const Callout = ({ children, className, icon }: CalloutProps) => {
  return <div className={clsx("fr-callout", icon, className)}>{children}</div>;
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

Callout.Description = function CalloutDescription({ children, className }: CalloutDescriptionProps) {
  return <div className={clsx("fr-callout__text", className)}>{children}</div>;
};

type CalloutButtonProps = PropsWithChildren<{
  className?: string;
  onClick?: VoidFunction;
}>;

Callout.Button = function CalloutButton({ children, className, onClick }: CalloutButtonProps) {
  return (
    <button className={clsx("fr-btn", className)} onClick={onClick}>
      {children}
    </button>
  );
};
