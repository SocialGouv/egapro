import clsx from "clsx";
import type { FunctionComponent } from "react";

export type FormGroupProps = {
  isError?: boolean;
  isValid?: boolean;
};

export const FormGroup: FunctionComponent<FormGroupProps> = ({ isValid, isError, children }) => {
  return (
    <div className={clsx("fr-input-group", isValid && "fr-input-group--valid", isError && "fr-input-group--error")}>
      {children}
    </div>
  );
};
