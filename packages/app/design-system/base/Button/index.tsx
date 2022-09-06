import React from "react"
import { buttonStyles, buttonStylesProps } from "../../utils/button-styles"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  buttonStylesProps & {
    label: string
    isDisabled?: boolean
  }

const Button = ({ variant, size, label, iconLeft, iconRight, iconOnly, isDisabled, ...rest }: ButtonProps) => {
  return (
    <button
      className={buttonStyles(variant, size, iconLeft, iconRight, iconOnly)}
      disabled={isDisabled}
      title={iconOnly && label}
      {...rest}
    >
      {label}
    </button>
  )
}

export default Button
