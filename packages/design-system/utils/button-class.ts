import clsx from "clsx"
import { iconClass } from "./icon-class"

export type buttonClassProps = {
  variant?: "secondary" | "tertiary" | "tertiary-no-border"
  size?: "sm" | "lg"
  iconLeft?: iconClass
  iconRight?: iconClass
  iconOnly?: iconClass
}

export const buttonClass = (
  variant: buttonClassProps["variant"],
  size: buttonClassProps["size"],
  iconLeft: buttonClassProps["iconLeft"],
  iconRight: buttonClassProps["iconRight"],
  iconOnly: buttonClassProps["iconOnly"]
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
    iconOnly && iconOnly
  )
