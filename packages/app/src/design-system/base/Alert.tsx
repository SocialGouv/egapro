import clsx from "clsx";
import type { PropsWithChildren, ReactNode } from "react";
import { Children } from "react";

import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";

type AlertProps = Omit<MarginProps, "ml" | "mr" | "mx"> & {
  children?: ReactNode;
  size?: "md" | "sm";
  type?: "error" | "info" | "success" | "warning";
};

type AuthorizedChildType = {
  type: {
    name: string;
  };
};

export const Alert = ({ type = "info", size = "md", children, ...rest }: AlertProps) => {
  const content = Children.toArray(children).filter(
    child => (child as AuthorizedChildType).type.name === "AlertContent",
  );

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
      {size === "md" ? children : content}
    </Box>
  );
};

Alert.Title = function AlertTitle({
  as: HtmlTag = "p",
  children,
  ...rest
}: PropsWithChildren<{ as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" }>) {
  return (
    <HtmlTag className="fr-alert__title" {...rest}>
      {children}
    </HtmlTag>
  );
};

Alert.Content = function AlertContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
