import React from "react"
import { buttonStyles, buttonStylesProps } from "../../utils/button-styles"

export type ButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  buttonStylesProps & {
    label: string
  }

const ButtonAsLink = ({ variant, size, label, iconLeft, iconRight, iconOnly, ...rest }: ButtonProps) => {
  return (
    <a className={buttonStyles(variant, size, iconLeft, iconRight, iconOnly)} title={iconOnly && label} {...rest}>
      {label}
    </a>
  )
}

export default ButtonAsLink
