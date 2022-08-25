import React from "react"
import NextLink from "next/link"
import { Button } from "@chakra-ui/react"
import { ButtonProps } from "./ButtonAction"

type ButtonLinkProps = ButtonProps & {
  to: string
}

function ButtonLink({
  label,
  to,
  colorScheme = "primary",
  variant = "solid",
  leftIcon,
  rightIcon,
  size = "md",
  fullWidth,
}: ButtonLinkProps) {
  return (
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
  )
}

export default ButtonLink
