"use client";

import { type TextColorStyle } from "@design-system/utils/color-styles";

export interface IconStyleJsxProps {
  color?: TextColorStyle;
  textColor?: TextColorStyle;
}

export const IconStyleJsx = ({ color, textColor }: IconStyleJsxProps) => {
  return (
    <style jsx>
      {`
        span {
          ${color ? `--icon-color: var(--${color});` : ""}
          ${textColor ? `color: var(--${textColor});` : ""}
        }
      `}
    </style>
  );
};
