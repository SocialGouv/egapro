import clsx from "clsx";
import { forwardRef } from "react";

export type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
};

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ placeholder, className, isDisabled, isValid, isError, children, ...rest }, ref) => {
    return (
      <select
        className={clsx("fr-select", isError && "fr-select--error", isValid && "fr-select--valid", className)}
        disabled={isDisabled}
        {...rest}
        ref={ref}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}

        {children}
      </select>
    );
  },
);

FormSelect.displayName = "FormSelect";
