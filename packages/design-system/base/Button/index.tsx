import React from "react"
import { buttonClass, buttonClassProps } from "../../utils/button-class"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  buttonClassProps & {
    label: string
    isDisabled?: boolean
  }

const Button = ({
  variant,
  size,
  label,
  iconLeft,
  iconRight,
  iconOnly,
  isDisabled,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={buttonClass(variant, size, iconLeft, iconRight, iconOnly)}
      disabled={isDisabled}
      title={iconOnly && label}
      {...rest}
    >
      {label}
    </button>
  )
}

export default Button
