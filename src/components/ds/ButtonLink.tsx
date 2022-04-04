import React from "react"
import { Link } from "react-router-dom"
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
    <Button
      to={to}
      as={Link}
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

export default ButtonLink
