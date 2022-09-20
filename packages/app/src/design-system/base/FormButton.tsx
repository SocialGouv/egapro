import React, { FunctionComponent } from "react"
import { buttonStyles, buttonStylesProps } from "../utils/button-styles"

export type FormButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  buttonStylesProps & {
    isDisabled?: boolean
  }

export const FormButton: FunctionComponent<FormButtonProps> = ({
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
