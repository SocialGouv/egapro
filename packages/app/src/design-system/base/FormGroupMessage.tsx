import clsx from "clsx";
import type { PropsWithChildren } from "react";

export type FormGroupMessageProps = PropsWithChildren<{
  id: string;
  isValid?: boolean;
}>;

export const FormGroupMessage = ({ isValid, id, children }: FormGroupMessageProps) => {
  return (
    <p id={`${id}-msg`} className={clsx(isValid ? "fr-valid-text" : "fr-error-text")}>
      {children}
    </p>
  );
};
