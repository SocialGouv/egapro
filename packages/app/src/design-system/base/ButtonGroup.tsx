import { clsx } from "clsx";
import type { PropsWithChildren } from "react";

import type { MarginProps } from "../utils/spacing";

export type ButtonGroupProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    as?: "div" | "ul";
    className?: string;
    iconPosition?: "left" | "right";
    inline?: "desktop-up" | "mobile-up" | "tablet-up";
    position?: "left" | "right";
  }
>;

export const ButtonGroup = ({
  as: HtmlTag = "div",
  inline,
  className,
  children,
  position,
  iconPosition,
  ...rest
}: ButtonGroupProps) => {
  return (
    <HtmlTag
      className={clsx(
        "fr-btns-group",
        inline === "mobile-up" && "fr-btns-group--inline-sm",
        inline === "tablet-up" && "fr-btns-group--inline-md",
        inline === "desktop-up" && "fr-btns-group--inline-lg",
        position && `fr-btns-group--${position}`,
        iconPosition && `fr-btns-group--icon-${iconPosition}`,
        className,
      )}
      {...rest}
    >
      {children}
    </HtmlTag>
  );
};
