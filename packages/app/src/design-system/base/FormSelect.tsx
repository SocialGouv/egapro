import clsx from "clsx";

export type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
  placeholder?: string;
};

export const FormSelect = ({
  placeholder,
  className,
  isDisabled,
  isValid,
  isError,
  children,
  ...rest
}: FormSelectProps) => {
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
