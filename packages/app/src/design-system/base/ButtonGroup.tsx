import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { Box } from "../base/Box";
import type { MarginProps } from "../utils/spacing";

export type ButtonGroupProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    className?: string;
    inline?: "desktop-up" | "mobile-up" | "tablet-up";
  }
>;

export const ButtonGroup = ({ inline, className, children, ...rest }: ButtonGroupProps) => {
  return (
    <Box
      className={clsx(
        "fr-btns-group",
        inline === "mobile-up" && "fr-btns-group--inline-sm",
        inline === "tablet-up" && "fr-btns-group--inline-md",
        inline === "desktop-up" && "fr-btns-group--inline-lg",
        className,
      )}
      {...rest}
    >
      {children}
    </Box>
  );
};
