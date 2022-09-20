import type { FunctionComponent } from "react";
import type { buttonStylesProps } from "../utils/button-styles";
import { buttonStyles } from "../utils/button-styles";

export type ButtonAsLinkProps = buttonStylesProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isCurrent?: boolean;
    isDisabled?: boolean;
  };

export const ButtonAsLink: FunctionComponent<ButtonAsLinkProps> = ({
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
  );
};
