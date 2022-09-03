import React from "react"
import { buttonClass, buttonClassProps } from "../../utils/button-class"

export type ButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  buttonClassProps & {
    label: string
  }

const ButtonAsLink = ({
  variant,
  size,
  label,
  iconLeft,
  iconRight,
  iconOnly,
  ...rest
}: ButtonProps) => {
  return (
    <a
      className={buttonClass(variant, size, iconLeft, iconRight, iconOnly)}
      title={iconOnly && label}
      {...rest}
    >
      {label}
    </a>
  )
}

export default ButtonAsLink
