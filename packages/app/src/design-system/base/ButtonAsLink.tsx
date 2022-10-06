import type { PropsWithChildren } from "react";
import { forwardRef } from "react";
import type { buttonStylesProps } from "../utils/button-styles";
import { buttonStyles } from "../utils/button-styles";

export type ButtonAsLinkProps = PropsWithChildren<
  buttonStylesProps &
    React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      isCurrent?: boolean;
      isDisabled?: boolean;
    }
>;

export type ButtonAsLinkRef = HTMLAnchorElement;

export const ButtonAsLink = forwardRef<ButtonAsLinkRef, ButtonAsLinkProps>(
  ({ href, isCurrent, isDisabled, variant, size, iconLeft, iconRight, iconOnly, target, children, ...rest }, ref) => {
    return (
      <a
        ref={ref}
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
  },
);

ButtonAsLink.displayName = "ButtonAsLink";
