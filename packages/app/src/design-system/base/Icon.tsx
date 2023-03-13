import { clsx } from "clsx";
import type { DetailsHTMLAttributes } from "react";

import type { TextColorStyle } from "../utils/color-styles";
import type { IconStyle } from "../utils/icon-styles";
import style from "./Icon.module.css";

export interface IconProps extends DetailsHTMLAttributes<HTMLSpanElement> {
  color?: TextColorStyle;
  icon: IconStyle;
}

export const Icon = ({ icon, onClick, color, ...rest }: IconProps) => (
  <span
    {...rest}
    style={color ? { color: `var(--${color})` } : {}}
    onClick={onClick}
    className={clsx(icon, onClick && style["icon-clickable"])}
    aria-hidden="true"
  ></span>
);
