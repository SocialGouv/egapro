import clsx from "clsx";
import * as React from "react";

export type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
  placeholder?: string;
};

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ placeholder, className, isDisabled, isValid, isError, children, ...rest }, ref) => {
    return (
      <select
        className={clsx("fr-select", isError && "fr-select--error", isValid && "fr-select--valid", className)}
        disabled={isDisabled}
        {...rest}
        ref={ref}
      >
        {placeholder && (
          <option value="" selected disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    );
  },
);

FormSelect.displayName = "FormSelect";
