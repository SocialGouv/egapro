import clsx from "clsx";
import type { PropsWithChildren } from "react";

export type FormGroupProps = PropsWithChildren<{
  isError?: boolean;
  isValid?: boolean;
}>;

export const FormGroup = ({ isValid, isError, children }: FormGroupProps) => {
  return (
    <div className={clsx("fr-input-group", isValid && "fr-input-group--valid", isError && "fr-input-group--error")}>
      {children}
    </div>
  );
};
