import clsx from "clsx";
import type { FunctionComponent } from "react";

import type { iconStyles } from "../utils/icon-styles";

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  iconLeft?: iconStyles;
  iconRight?: iconStyles;
  isCurrent?: boolean;
  isDisabled?: boolean;
  size?: "lg" | "sm";
};

export const Link: FunctionComponent<LinkProps> = ({
  href,
  children,
  size,
  iconLeft,
  iconRight,
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
      className={clsx(
        "fr-link",
        size === "sm" && "fr-link--sm",
        size === "lg" && "fr-link--lg",
        iconLeft && `fr-link--icon-left ${iconLeft}`,
        iconRight && `fr-link--icon-right ${iconRight}`,
      )}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      {...rest}
    >
      {children}
    </a>
  );
};
