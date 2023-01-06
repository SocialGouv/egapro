import clsx from "clsx";
import type { PropsWithChildren, ReactElement } from "react";
import { Children, cloneElement, forwardRef } from "react";

import { ConditionalWrapper } from "../utils/ConditionalWrapper";
import type { MarginProps } from "../utils/spacing";
import { Box } from "./Box";
import styles from "./FormCheckbox.module.css";

export interface FormCheckboxGroupProps extends Omit<MarginProps, "ml" | "mr" | "mx"> {
  ariaLabelledby?: string;
  inline?: boolean;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
  singleCheckbox?: boolean;
  size?: "md" | "sm";
}
export const FormCheckboxGroup = ({
  inline,
  children,
  singleCheckbox,
  isError,
  isValid,
  size,
  ariaLabelledby,
  isDisabled,
  ...rest
}: PropsWithChildren<FormCheckboxGroupProps>) => (
  <ConditionalWrapper
    condition={!!singleCheckbox}
    wrapper={checkbox => (
      <Box className={clsx(inline && "fr-fieldset--inline", size === "sm" && "fr-checkbox-group--sm")}>
        {cloneElement(Children.only(checkbox) as ReactElement<FormCheckboxProps>, { isDisabled })}
      </Box>
    )}
    elseWrapper={checkboxes => (
      <Box className="fr-form-group" {...rest}>
        <fieldset
          className={clsx(
            "fr-fieldset",
            isError && "fr-fieldset--error",
            isValid && "fr-fieldset--valid",
            inline && "fr-fieldset--inline",
            size === "sm" && "fr-checkbox-group--sm",
          )}
          disabled={isDisabled}
          role="group"
          aria-labelledby={ariaLabelledby}
        >
          {checkboxes}
        </fieldset>
      </Box>
    )}
  >
    {children}
  </ConditionalWrapper>
);

export type FormCheckboxGroupLegendProps = PropsWithChildren<{ className?: string; id: string }>;

export const FormCheckboxGroupLegend = ({ children, id, className }: FormCheckboxGroupLegendProps) => (
  <legend className={clsx("fr-fieldset__legend fr-text--regular", className)} id={id}>
    {children}
  </legend>
);

export const FormCheckboxGroupContent = ({ children }: PropsWithChildren) => (
  <Box className="fr-fieldset__content">{children}</Box>
);

export type FormCheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
};

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ id, children, isError, isDisabled, ...inputProps }, ref) => {
    return (
      <Box className={clsx("fr-checkbox-group", isError && styles.error)}>
        <input type="checkbox" id={id} name={id} ref={ref} {...inputProps} disabled={isDisabled} />
        <label className="fr-label" htmlFor={id}>
          {children ?? <>&nbsp;</>}
        </label>
      </Box>
    );
  },
);

FormCheckbox.displayName = "FormCheckbox";
