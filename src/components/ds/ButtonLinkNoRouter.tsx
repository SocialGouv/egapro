import React from "react"
import { Button } from "@chakra-ui/react"
import { ButtonProps } from "./ButtonAction"

type ButtonLinkNoRouterProps = ButtonProps & {
  to: string
}

function ButtonLinkNoRouter({
  label,
  to,
  colorScheme = "primary",
  variant = "solid",
  leftIcon,
  rightIcon,
  size = "md",
  fullWidth,
}: ButtonLinkNoRouterProps) {
  return (
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
  )
}

export default ButtonLinkNoRouter
