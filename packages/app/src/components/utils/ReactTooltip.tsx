"use client";

import { type ITooltip, Tooltip } from "react-tooltip";

import { ERROR_TOOLTIP_ID } from "./TooltipWrapper";

/** See TooltipWrapper for usage */
export const ReactTooltip = (props: ITooltip) => {
  return <Tooltip id={ERROR_TOOLTIP_ID} disableStyleInjection="core" {...props} />;
};
