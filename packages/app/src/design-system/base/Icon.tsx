import { type FrIconClassName } from "@codegouvfr/react-dsfr";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";

import { type TextColorStyle } from "../utils/color-styles";
import style from "./Icon.module.css";

export type IconProps = {
  className?: CxArg;
  color?: TextColorStyle;
  icon: FrIconClassName;
  onClick?: () => void;
  size?: "lg" | "sm" | "xs";
} & (IconProps.WithoutText | IconProps.WithText);

export namespace IconProps {
  export interface WithText {
    /**
     * Left by default
     */
    iconPosition?: "left" | "right";
    text: string;
    valign?: "bottom" | "top";
  }

  export interface WithoutText {
    iconPosition?: never;
    text?: never;
    valign?: never;
  }
}

/**
 * Icon component, based on DSFR's Icon css component.
 */
export const Icon = ({ icon, onClick, color, size, className, text, iconPosition = "left", valign }: IconProps) => (
  <span
    style={color ? { color: `var(--${color})` } : {}}
    onClick={onClick}
    className={cx(
      style["fr-icon"],
      icon,
      onClick && style["fr-icon--clickable"],
      `fr-icon${size ? `--${size}` : ""}`,
      className,
      iconPosition && style[`fr-icon--${iconPosition}`],
      valign && style[`fr-icon--valign-${valign}`],
    )}
    aria-hidden={text ? "false" : "true"}
    {...(text && {
      children: text,
    })}
  ></span>
);
