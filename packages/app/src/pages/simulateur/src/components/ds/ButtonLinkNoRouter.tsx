import React from "react"
import NextLink from "next/link"
import { Button } from "@chakra-ui/react"
import { ButtonProps } from "./ButtonAction"

type ButtonLinkNoRouterProps = ButtonProps & {
  to: string
}

// Link with a for external links.
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
    <NextLink href={to}>
      <Button
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
    </NextLink>
  )
}

export default ButtonLinkNoRouter
