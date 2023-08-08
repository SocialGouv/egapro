import { type FrIconClassName } from "@codegouvfr/react-dsfr";
import { cx, type CxArg } from "@codegouvfr/react-dsfr/tools/cx";

import { type TextColorStyle } from "../utils/color-styles";
import style from "./Icon.module.scss";

export type IconProps = {
  className?: CxArg;
  color?: TextColorStyle;
  icon: FrIconClassName;
  onClick?: () => void;
  /**
   * @default sm
   */
  size?: "lg" | "sm" | "xs";
  title?: string;
} & (IconProps.WithoutText | IconProps.WithText);

export namespace IconProps {
  export interface WithText {
    /**
     * @default left
     */
    align?: "center" | "left" | "right" | "space-around" | "space-between" | "space-evenly";
    /**
     * @default left
     */
    iconPosition?: "left" | "right";
    text: string;
    textColor?: TextColorStyle;
    valign?: "bottom" | "top";
  }

  export interface WithoutText {
    align?: never;
    iconPosition?: never;
    text?: never;
    textColor?: never;
    valign?: never;
  }
}

/**
 * Icon component, based on DSFR's Icon css component.
 */
export const Icon = ({
  icon,
  onClick,
  color,
  size = "sm",
  className,
  text,
  iconPosition = "left",
  valign,
  align = "left",
  textColor,
  ...rest
}: IconProps) => (
  <span
    {...rest}
    style={
      {
        ...(color && {
          "--icon-color": `var(--${color})`,
        }),
        ...(textColor && {
          color: `var(--${textColor})`,
        }),
      } as React.CSSProperties
    }
    onClick={onClick}
    className={cx(
      icon,
      className,
      style["fr-icon"],
      size && style[`fr-icon--${size}`],
      onClick && style["fr-icon--clickable"],
      iconPosition && style[`fr-icon--${iconPosition}`],
      valign && style[`fr-icon--valign-${valign}`],
      align && style[`fr-icon--align-${align}`],
    )}
    aria-hidden={text ? "false" : "true"}
    {...(text && {
      children: text,
    })}
  ></span>
);
