import { Button } from "@chakra-ui/react";
import React from "react";
import type { ButtonProps } from "./ButtonAction";

export type ButtonLinkNoRouterProps = ButtonProps & {
  to: string;
};

/**
 * Link with a for external links.
 */
export const ButtonLinkNoRouter: React.FC<ButtonLinkNoRouterProps> = ({
  label,
  to,
  colorScheme = "primary",
  variant = "solid",
  leftIcon,
  rightIcon,
  size = "md",
  fullWidth,
}) => (
  <Button
    href={to}
    as="a"
    colorScheme={colorScheme}
    variant={variant}
    leftIcon={leftIcon}
    rightIcon={rightIcon}
    size={size}
    sx={{
      width: fullWidth ? "100%" : "auto",
    }}
  >
    {label}
  </Button>
);
