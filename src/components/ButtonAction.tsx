import React from "react"
import { Button, ButtonProps as ButtonChakraProps } from "@chakra-ui/react"

export type ButtonProps = ButtonChakraProps & {
  label: string
  colorScheme?: "primary" | "gray" | "orange"
  variant?: "solid" | "outline" | "ghost" | "link"
  leftIcon?: React.ReactElement
  rightIcon?: React.ReactElement
  size?: "xs" | "sm" | "md" | "lg"
  fullWidth?: boolean
}

export type ButtonActionProps = ButtonProps & {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: "button" | "submit" | "reset" | undefined
}

function ButtonAction({
  label,
  colorScheme = "primary",
  variant = "solid",
  onClick,
  leftIcon,
  rightIcon,
  type,
  size = "md",
  disabled = false,
  loading = false,
  fullWidth,
  ...rest
}: ButtonActionProps) {
  return (
    <Button
      size={size}
      type={type}
      onClick={onClick}
      isDisabled={disabled}
      isLoading={loading}
      colorScheme={colorScheme}
      variant={variant}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      sx={{
        width: fullWidth ? "100%" : "auto",
      }}
      {...rest}
    >
      {label}
    </Button>
  )
}
export default ButtonAction
