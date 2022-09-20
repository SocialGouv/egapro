import clsx from "clsx";
import type { FunctionComponent } from "react";

import type { iconStyles } from "../utils/icon-styles";

export type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: iconStyles;
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
};

export const FormInput: FunctionComponent<FormInputProps> = ({
  type = "text",
  isError,
  isValid,
  isDisabled,
  icon,
  id,
  ...rest
}) => {
  return (
    <div className={clsx("fr-input-wrap", icon, type === "date" && "fr-icon-calendar-line")}>
      <input
        id={id}
        className={clsx("fr-input", isError && "fr-input--error", isValid && "fr-input--valid")}
        type={type}
        disabled={isDisabled}
        aria-describedby={`${id}-msg`}
        {...rest}
      />
    </div>
  );
};
