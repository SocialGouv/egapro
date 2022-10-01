import clsx from "clsx";

import type { iconStyles } from "../utils/icon-styles";

export type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: iconStyles;
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
};

export const FormInput = ({ type = "text", isError, isValid, isDisabled, icon, id, ...rest }: FormInputProps) => {
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
