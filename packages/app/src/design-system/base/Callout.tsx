import clsx from "clsx";
import type { PropsWithChildren } from "react";

import type { iconStyles } from "../utils/icon-styles";
import styles from "./Callout.module.css";

export type CalloutProps = PropsWithChildren<{
  buttonLabel?: string;
  buttonOnClick?: VoidFunction;
  className?: string;
  icon?: iconStyles;
  title?: string;
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

export const Callout = ({
  buttonLabel,
  className,
  buttonOnClick,
  title,
  titleAs: HtmlTag = "p",
  children,
  icon,
}: CalloutProps) => {
  return (
    <div className={clsx("fr-callout", icon, className)}>
      {title && <HtmlTag className={clsx("fr-callout__title", styles.title)}>{title}</HtmlTag>}
      <div className="fr-callout__text">{children}</div>
      {buttonLabel && buttonOnClick && (
        <button className="fr-btn" onClick={buttonOnClick}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
};
