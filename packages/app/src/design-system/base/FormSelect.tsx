import clsx from "clsx";
import type { FunctionComponent } from "react";

export type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
  placeholder?: string;
};

export const FormSelect: FunctionComponent<FormSelectProps> = ({
  placeholder,
  className,
  isDisabled,
  isValid,
  isError,
  children,
  ...rest
}) => {
  return (
    <select
      className={clsx("fr-select", isError && "fr-select--error", isValid && "fr-select--valid", className)}
      disabled={isDisabled}
      {...rest}
    >
      {placeholder && (
        <option value="" selected disabled hidden>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
};
