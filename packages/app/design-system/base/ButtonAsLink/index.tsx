import React, { FunctionComponent } from "react"
import { buttonStyles, buttonStylesProps } from "../../utils/button-styles"

export type ButtonAsLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  buttonStylesProps & {
    isDisabled?: boolean
    isCurrent?: boolean
  }

const ButtonAsLink: FunctionComponent<ButtonAsLinkProps> = ({
  href,
  variant,
  size,
  children,
  iconLeft,
  iconRight,
  iconOnly,
  target,
  isDisabled,
  isCurrent,
  ...rest
}) => {
  return (
    <a
      href={href || undefined}
      aria-current={isCurrent ? "page" : undefined}
      aria-disabled={isDisabled || !href ? true : undefined}
      className={buttonStyles(variant, size, iconLeft, iconRight, iconOnly)}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      {...rest}
    >
      {children}
    </a>
  )
}

export default ButtonAsLink
