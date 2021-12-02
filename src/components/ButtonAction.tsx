import React from "react"
import { Button } from "@chakra-ui/react"

export interface ButtonProps {
  label: string
  colorScheme?: "primary" | "gray"
  variant?: "solid" | "outline" | "ghost" | "link"
  leftIcon?: React.ReactElement
  rightIcon?: React.ReactElement
  size?: "xs" | "sm" | "md" | "lg"
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
    >
      {label}
    </Button>
  )
}
export default ButtonAction
