import type { PropsWithoutChildren } from "@common/utils/types";
import { clsx } from "clsx";

import type { TextColorStyle } from "../utils/color-styles";
import type { IconStyle } from "../utils/icon-styles";
import style from "./Icon.module.css";

export type IconProps = JSX.IntrinsicElements["span"] & {
  color?: TextColorStyle;
  icon: IconStyle;
};

export const Icon = ({ icon, onClick, color, ...rest }: PropsWithoutChildren<IconProps>) => (
  <span
    {...rest}
    style={color ? { color: `var(--${color})` } : {}}
    onClick={onClick}
    className={clsx(icon, onClick && style["icon-clickable"])}
    aria-hidden="true"
  ></span>
);
