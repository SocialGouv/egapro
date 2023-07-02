import { type FrIconClassName } from "@codegouvfr/react-dsfr";
import { type PropsWithoutChildren } from "@common/utils/types";
import { clsx } from "clsx";

import { type TextColorStyle } from "../utils/color-styles";
import style from "./Icon.module.css";

export type IconProps = JSX.IntrinsicElements["span"] & {
  color?: TextColorStyle;
  icon: FrIconClassName;
  size?: "lg" | "sm" | "xs";
};

/**
 * Icon component, based on DSFR's Icon css component.
 */
export const Icon = ({ icon, onClick, color, size, ...rest }: PropsWithoutChildren<IconProps>) => (
  <span
    {...rest}
    style={color ? { color: `var(--${color})` } : {}}
    onClick={onClick}
    className={clsx(icon, onClick && style["icon-clickable"], `fr-icon${size ? `--${size}` : ""}`)}
    aria-hidden="true"
  ></span>
);
