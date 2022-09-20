import clsx from "clsx";
import type { iconStyles } from "./icon-styles";

export type buttonStylesProps = {
  iconLeft?: iconStyles;
  iconOnly?: iconStyles;
  iconRight?: iconStyles;
  size?: "lg" | "sm";
  variant?: "secondary" | "tertiary-no-border" | "tertiary";
};

export const buttonStyles = (
  variant: buttonStylesProps["variant"],
  size: buttonStylesProps["size"],
  iconLeft: buttonStylesProps["iconLeft"],
  iconRight: buttonStylesProps["iconRight"],
  iconOnly: buttonStylesProps["iconOnly"],
): string =>
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
