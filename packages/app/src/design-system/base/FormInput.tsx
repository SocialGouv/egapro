import clsx from "clsx";
import type { HTMLInputTypeAttribute, RefObject } from "react";
import { forwardRef, useState } from "react";

import type { IconStyles } from "../utils/icon-styles";
import styles from "./FormInput.module.css";

type FormInputCustomTypes = HTMLInputTypeAttribute | "percentage";

type InputValue = number | string | readonly string[] | undefined;

export type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: IconStyles;
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
  ref?: RefObject<HTMLInputElement>;
  type?: FormInputCustomTypes;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ type = "text", isError, isValid, isDisabled, icon, id, onChange, ...rest }, ref) => {
    const [inputValue, setInputValue] = useState<InputValue>();

    if (type === "percentage") {
      const onChangeWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);
        return onChange && onChange(event);
      };

      return (
        <div className="fr-input-wrap">
          <input
            id={id}
            className={clsx("fr-input", isError && "fr-input--error", isValid && "fr-input--valid", styles.date)}
            type="number"
            min="0"
            max="100"
            step="0.1"
            disabled={isDisabled}
            aria-describedby={`${id}-msg`}
            aria-invalid={isError || "false"}
            ref={ref}
            onChange={onChange ? onChangeWrapper : undefined}
            {...rest}
          />
          {inputValue && <div className={styles.percentage} />}
        </div>
      );
    }
    return (
      <div className={clsx("fr-input-wrap", icon, type === "date" && "fr-icon-calendar-line")}>
        <input
          id={id}
          className={clsx("fr-input", isError && "fr-input--error", isValid && "fr-input--valid", styles.date)}
          type={type}
          disabled={isDisabled}
          aria-describedby={`${id}-msg`}
          aria-invalid={isError || "false"}
          ref={ref}
          onChange={onChange}
          {...rest}
        />
      </div>
    );
  },
);

FormInput.displayName = "FormInput";
