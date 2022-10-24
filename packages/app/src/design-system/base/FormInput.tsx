import clsx from "clsx";
import type { HTMLInputTypeAttribute } from "react";
import { forwardRef } from "react";

import type { IconStyles } from "../utils/icon-styles";
import styles from "./FormInput.module.css";

type FormInputCustomTypes = HTMLInputTypeAttribute | "percentage";

export type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: IconStyles;
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
  type?: FormInputCustomTypes;
};

const PercentageCharacter = () => <div className={styles.percentage} />;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ type = "text", isError, isValid, isDisabled, icon, id, ...rest }, ref) => {
    if (type === "percentage") {
      return (
        <div className="fr-input-wrap">
          <input
            id={id}
            className={clsx(
              "fr-input",
              isError && "fr-input--error",
              isValid && "fr-input--valid",
              styles.date,
              styles.input,
            )}
            type="number"
            min="0"
            max="100"
            step="0.1"
            disabled={isDisabled}
            aria-invalid={isError ? "true" : undefined}
            ref={ref}
            {...rest}
          />
          {!isNaN(rest?.value as number) ? <PercentageCharacter /> : null}
        </div>
      );
    }
    return (
      <div className={clsx("fr-input-wrap", icon, type === "date" && "fr-icon-calendar-line")}>
        <input
          id={id}
          className={clsx(
            "fr-input",
            isError && "fr-input--error",
            isValid && "fr-input--valid",
            styles.date,
            styles.input,
          )}
          type={type}
          disabled={isDisabled}
          aria-invalid={isError ? "true" : undefined}
          ref={ref}
          {...rest}
        />
      </div>
    );
  },
);

FormInput.displayName = "FormInput";
