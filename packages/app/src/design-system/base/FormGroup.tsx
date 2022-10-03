import clsx from "clsx";
import type { PropsWithChildren } from "react";
export type FormGroupProps = PropsWithChildren<{
  isError?: boolean;
  isValid?: boolean;
}>;

// TODO: Add filtering children
export const FormGroup = ({ isValid, isError, children }: FormGroupProps) => {
  return (
    <div className={clsx("fr-input-group", isValid && "fr-input-group--valid", isError && "fr-input-group--error")}>
      {children}
    </div>
  );
};

type FormLabelProps = PropsWithChildren<{
  as?: "label" | "legend";
  hint?: string;
  htmlFor: string;
}>;

FormGroup.Label = function FormGroupLabel({ as: HtmlTag = "label", htmlFor, hint, children }: FormLabelProps) {
  return (
    <HtmlTag className={clsx("fr-label", HtmlTag === "legend" && "fr-pl-0")} htmlFor={htmlFor}>
      {children}
      {hint && (
        <span className="fr-hint-text" id={`${htmlFor}-hint`}>
          {hint}
        </span>
      )}
    </HtmlTag>
  );
};

type FormGroupMessageProps = PropsWithChildren<{
  id: string;
  isValid?: boolean;
}>;

FormGroup.Message = function FormGroupMessage({ isValid, id, children }: FormGroupMessageProps) {
  return (
    <p id={`${id}-msg`} className={clsx(isValid ? "fr-valid-text" : "fr-error-text")}>
      {children}
    </p>
  );
};
