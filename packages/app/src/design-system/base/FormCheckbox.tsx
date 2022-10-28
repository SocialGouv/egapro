import clsx from "clsx";
import { forwardRef } from "react";

import styles from "./FormCheckbox.module.css";

export type FormCheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
};

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ id, children, isError, isDisabled, ...inputProps }, ref) => {
    return (
      <div className={clsx("fr-checkbox-group", isError && styles.error)}>
        <input
          type="checkbox"
          id={id}
          name={id}
          ref={ref}
          className={styles.input}
          {...inputProps}
          disabled={isDisabled}
        />
        <label className="fr-label" htmlFor={id}>
          {children}
        </label>
      </div>
    );
  },
);

FormCheckbox.displayName = "FormCheckbox";
