import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { forwardRef } from "react";

import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";

export type FormRadioGroupProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    ariaLabelledby?: string;
    inline?: boolean;
    isDisabled?: boolean;
    isError?: boolean;
    isValid?: boolean;
    size?: "md" | "sm";
  }
>;

export const FormRadioGroup = ({
  children,
  isError,
  isValid,
  isDisabled,
  size = "md",
  inline,
  ariaLabelledby,
  ...rest
}: FormRadioGroupProps) => {
  return (
    <Box
      className={clsx("fr-form-group", size === "sm" && "fr-radio-group--sm", inline && "fr-fieldset--inline")}
      {...rest}
    >
      <fieldset
        className={clsx("fr-fieldset", isError && "fr-fieldset--error", isValid && "fr-fieldset--valid")}
        disabled={isDisabled}
        role="group"
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </fieldset>
    </Box>
  );
};

export type FormRadioGroupLegendProps = PropsWithChildren<{ className?: string; id: string }>;

export const FormRadioGroupLegend = ({ children, id, className }: FormRadioGroupLegendProps) => (
  <legend className={clsx("fr-fieldset__legend fr-text--regular", className)} id={id}>
    {children}
  </legend>
);

export const FormRadioGroupContent = ({ children }: PropsWithChildren) => (
  <div className="fr-fieldset__content">{children}</div>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export type FormRadioGroupInputProps = Pick<InputProps, "checked" | "children" | "onChange" | "readOnly" | "value"> & {
  id: NonNullable<InputProps["id"]>;
  name: NonNullable<InputProps["name"]>;
};

export const FormRadioGroupInput = forwardRef<HTMLInputElement, FormRadioGroupInputProps>(
  ({ children, id, ...inputProps }, ref) => {
    return (
      <div className="fr-radio-group">
        <input id={id} type="radio" ref={ref} {...inputProps} />
        <label className="fr-label" htmlFor={id}>
          {children}
        </label>
      </div>
    );
  },
);

FormRadioGroupInput.displayName = "FormRadioGroupInput";

export type FormRadioGroupValidationMessageProps = PropsWithChildren<{
  id: string;
  isError?: boolean;
  isValid?: boolean;
}>;

export const FormRadioGroupValidationMessage = ({
  children,
  isError,
  isValid,
  id,
}: FormRadioGroupValidationMessageProps) => (
  <p id={id} className={clsx(isError && "fr-error-text", isValid && "fr-valid-text")}>
    {children}
  </p>
);
