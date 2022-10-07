import clsx from "clsx";
import { forwardRef } from "react";

import type { IconStyles } from "../utils/icon-styles";

export type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: IconStyles;
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
  type?: string;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ type = "text", isError, isValid, isDisabled, icon, id, ...rest }, ref) => (
    <div className={clsx("fr-input-wrap", icon, type === "date" && "fr-icon-calendar-line")}>
      <input
        id={id}
        className={clsx("fr-input", isError && "fr-input--error", isValid && "fr-input--valid")}
        type={type}
        disabled={isDisabled}
        aria-describedby={`${id}-msg`}
        aria-invalid={isError || "false"}
        ref={ref}
        {...rest}
      />
    </div>
  ),
);

FormInput.displayName = "FormInput";
