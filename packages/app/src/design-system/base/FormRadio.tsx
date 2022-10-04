import clsx from "clsx";
import type { PropsWithChildren } from "react";
import React from "react";

import { Box } from "./Box";
import type { MarginProps } from "design-system/utils/spacing";

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

export type FormRadioGroupLegendProps = PropsWithChildren<{ id: string }>;

export const FormRadioGroupLegend = ({ children, id }: FormRadioGroupLegendProps) => (
  <legend className="fr-fieldset__legend fr-text--regular" id={id}>
    {children}
  </legend>
);

export type FormRadioGroupContentProps = PropsWithChildren<Record<never, never>>;

export const FormRadioGroupContent = ({ children }: FormRadioGroupContentProps) => (
  <div className="fr-fieldset__content">{children}</div>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export type FormRadioGroupInputProps = Pick<InputProps, "checked" | "children" | "onChange" | "value"> & {
  id: NonNullable<InputProps["id"]>;
  name: NonNullable<InputProps["name"]>;
};

export const FormRadioGroupInput = ({ children, id, ...inputProps }: FormRadioGroupInputProps) => (
  <div className="fr-radio-group">
    <input id={id} type="radio" {...inputProps} />
    <label className="fr-label" htmlFor={id}>
      {children}
    </label>
  </div>
);

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
