import { Button } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";

import type { ButtonProps } from "./ButtonAction";

type ButtonLinkProps = ButtonProps & {
  to: string;
};

export const ButtonLink: React.FC<ButtonLinkProps> = ({
  label,
  to,
  colorScheme = "primary",
  variant = "solid",
  leftIcon,
  rightIcon,
  size = "md",
  fullWidth,
}) => (
  <NextLink href={to}>
    <Button
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
  </NextLink>
);
