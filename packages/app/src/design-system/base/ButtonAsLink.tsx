import { clsx } from "clsx";
import { forwardRef } from "react";

import type { ButtonStylesProps } from "../utils/button-styles";
import { buttonStyles } from "../utils/button-styles";
import type { NextLinkOrAProps } from "../utils/NextLinkOrA";
import { NextLinkOrA } from "../utils/NextLinkOrA";

export type ButtonAsLinkProps = ButtonStylesProps &
  NextLinkOrAProps & {
    isCurrent?: boolean;
    isDisabled?: boolean;
    isExternal?: boolean;
  };

export const ButtonAsLink = forwardRef<HTMLAnchorElement, ButtonAsLinkProps>(
  (
    {
      isCurrent,
      isDisabled,
      variant,
      size,
      iconLeft,
      iconRight,
      iconOnly,
      target,
      children,
      className,
      isExternal,
      ...rest
    },
    ref,
  ) => {
    const hasHref = "href" in rest;
    return (
      <NextLinkOrA
        ref={ref}
        href={hasHref ? rest.href : undefined}
        aria-current={isCurrent ? "page" : undefined}
        aria-disabled={isDisabled || !hasHref ? true : undefined}
        className={clsx(buttonStyles({ variant, size, iconLeft, iconRight, iconOnly }), className)}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        isExternal={isExternal}
        {...rest}
      >
        {children}
      </NextLinkOrA>
    );
  },
);

ButtonAsLink.displayName = "ButtonAsLink";
