import { type PropsWithChildren } from "react";

export const ERROR_TOOLTIP_ID = "error-tooltip";

export type TooltipWrapperProps = PropsWithChildren & {
  id: string;
  message?: string;
};

export const TooltipWrapper = ({ id, message = "", children }: TooltipWrapperProps) => (
  <div data-tooltip-id={id} data-tooltip-content={message}>
    {children}
  </div>
);
