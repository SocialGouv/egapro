import React, { FunctionComponent } from "react"
import { buttonStyles, buttonStylesProps } from "../../../utils/button-styles"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  buttonStylesProps & {
    isDisabled?: boolean
  }

const Button: FunctionComponent<ButtonProps> = ({
  variant,
  size,
  children,
  iconLeft,
  title,
  iconRight,
  iconOnly,
  isDisabled,
  ...rest
}) => {
  return (
    <button
      className={buttonStyles(variant, size, iconLeft, iconRight, iconOnly)}
      disabled={isDisabled}
      title={title}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
