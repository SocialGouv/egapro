import { clsx } from "clsx";
import { forwardRef } from "react";

import type { ButtonStylesProps } from "../utils/button-styles";
import { buttonStyles } from "../utils/button-styles";

export type ButtonAsLinkProps = ButtonStylesProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isCurrent?: boolean;
    isDisabled?: boolean;
  };

export type ButtonAsLinkRef = HTMLAnchorElement;

export const ButtonAsLink = forwardRef<ButtonAsLinkRef, ButtonAsLinkProps>(
  (
    { href, isCurrent, isDisabled, variant, size, iconLeft, iconRight, iconOnly, target, children, className, ...rest },
    ref,
  ) => {
    return (
      <a
        ref={ref}
        href={href || undefined}
        aria-current={isCurrent ? "page" : undefined}
        aria-disabled={isDisabled || !href ? true : undefined}
        className={clsx(buttonStyles({ variant, size, iconLeft, iconRight, iconOnly }), className)}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  },
);

ButtonAsLink.displayName = "ButtonAsLink";
