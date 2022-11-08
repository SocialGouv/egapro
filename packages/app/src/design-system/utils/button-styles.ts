import clsx from "clsx";

import type { IconStyles } from "./icon-styles";

export type ButtonStylesProps = {
  iconLeft?: IconStyles;
  iconOnly?: IconStyles;
  iconRight?: IconStyles;
  size?: "lg" | "sm";
  variant?: "secondary" | "tertiary-no-border" | "tertiary";
};

export const buttonStyles = ({ variant, size, iconLeft, iconRight, iconOnly }: ButtonStylesProps): string =>
  clsx(
    "fr-btn",
    variant === "secondary" && "fr-btn--secondary",
    variant === "tertiary" && "fr-btn--tertiary",
    variant === "tertiary-no-border" && "fr-btn--tertiary-no-outline",
    size === "sm" && "fr-btn--sm",
    size === "lg" && "fr-btn--lg",
    iconLeft && `fr-btn--icon-left ${iconLeft}`,
    iconRight && `fr-btn--icon-right ${iconRight}`,
    iconOnly && iconOnly,
  );
