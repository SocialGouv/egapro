import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";

export type AlertProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    size?: "md" | "sm";
    type?: "error" | "info" | "success" | "warning";
  }
>;

export const Alert = ({ type = "info", size = "md", children, ...rest }: AlertProps) => {
  return (
    <Box
      role="alert"
      className={clsx(
        "fr-alert",
        type === "error" && "fr-alert--error",
        type === "success" && "fr-alert--success",
        type === "info" && "fr-alert--info",
        type === "warning" && "fr-alert--warning",
        size === "sm" && "fr-alert--sm",
      )}
      {...rest}
    >
      {children}
    </Box>
  );
};

export type AlertTitleProps = PropsWithChildren<{ as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" }>;

export const AlertTitle = ({ as: HtmlTag = "p", children, ...rest }: AlertTitleProps) => {
  return (
    <HtmlTag className="fr-alert__title" {...rest}>
      {children}
    </HtmlTag>
  );
};
