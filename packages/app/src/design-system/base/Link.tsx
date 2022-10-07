import clsx from "clsx";

import type { IconStyles } from "../utils/icon-styles";

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  iconLeft?: IconStyles;
  iconRight?: IconStyles;
  isCurrent?: boolean;
  isDisabled?: boolean;
  size?: "lg" | "sm";
};

export const Link = ({
  href,
  children,
  size,
  iconLeft,
  iconRight,
  target,
  isDisabled,
  isCurrent,
  ...rest
}: LinkProps) => {
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
