import { clsx } from "clsx";

import type { IconStyle } from "./icon-styles";

export type ButtonStylesProps = {
  iconLeft?: IconStyle;
  iconOnly?: IconStyle;
  iconRight?: IconStyle;
  size?: "lg" | "sm";
  variant?: "close" | "secondary" | "tertiary-no-border" | "tertiary";
};

export const buttonStyles = ({ variant, size, iconLeft, iconRight, iconOnly }: ButtonStylesProps): string =>
  clsx(
    "fr-btn",
    variant && `fr-btn--${variant}`,
    size && `fr-btn--${size}`,
    iconLeft && `fr-btn--icon-left ${iconLeft}`,
    iconRight && `fr-btn--icon-right ${iconRight}`,
    iconOnly && iconOnly,
  );
