import React from "react"
import { Link } from "react-router-dom"
import { Button } from "@chakra-ui/react"
import { ButtonProps } from "./ButtonAction"

type ButtonLinkProps = ButtonProps & {
  to: string
  target?: "_blank" | "_self" | "_parent"
}

// Link with React Router Link.
function ButtonLink({
  label,
  to,
  colorScheme = "primary",
  variant = "solid",
  leftIcon,
  rightIcon,
  size = "md",
  fullWidth,
  target,
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
      target={target}
      sx={{
        width: fullWidth ? "100%" : "auto",
      }}
    >
      {label}
    </Button>
  )
}

export default ButtonLink
