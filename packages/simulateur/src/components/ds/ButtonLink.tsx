import React from "react"
import { Link as RouterLink } from "react-router-dom"
import { Button, Link } from "@chakra-ui/react"
import { ButtonProps } from "./ButtonAction"

type ButtonLinkProps = ButtonProps & {
  to: string
  isExternal?: boolean
}

/**
 *  Link with React Router Link or Chakra Link if isExternal.
 */
function ButtonLink({
  label,
  to,
  colorScheme = "primary",
  variant = "solid",
  leftIcon,
  rightIcon,
  size = "md",
  fullWidth,
  isExternal,
}: ButtonLinkProps) {
  const props = {
    colorScheme,
    variant,
    leftIcon,
    rightIcon,
    size,
    sx: {
      width: fullWidth ? "auto" : "max-content",
    },
  }

  return (
    <>
      {isExternal ? (
        <Button as={Link} {...props} href={to} isExternal>
          {label}
        </Button>
      ) : (
        <Button as={RouterLink} {...props} to={to}>
          {label}
        </Button>
      )}
    </>
  )
}

export default ButtonLink
