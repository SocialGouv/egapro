import clsx from "clsx";
import type { PropsWithChildren } from "react";

export type FormGroupProps = PropsWithChildren<{
  isError?: boolean;
  isValid?: boolean;
}>;

export const FormGroup = ({ isValid, isError, children }: FormGroupProps) => (
  <div className={clsx("fr-input-group", isValid && "fr-input-group--valid", isError && "fr-input-group--error")}>
    {children}
  </div>
);

export type FormLabelProps = PropsWithChildren<{
  as?: "label" | "legend";
  hint?: string;
  htmlFor: string;
}>;

export const FormGroupLabel = ({ as: HtmlTag = "label", htmlFor, hint, children }: FormLabelProps) => (
  <HtmlTag className={clsx("fr-label", HtmlTag === "legend" && "fr-pl-0")} htmlFor={htmlFor}>
    {children}
    {hint && (
      <span className="fr-hint-text" id={`${htmlFor}-hint`}>
        {hint}
      </span>
    )}
  </HtmlTag>
);

export type FormGroupMessageProps = PropsWithChildren<{
  id: string;
  isValid?: boolean;
}>;

export const FormGroupMessage = ({ isValid, id, children, ...rest }: FormGroupMessageProps) => (
  <p id={id} className={clsx(isValid ? "fr-valid-text" : "fr-error-text")} {...rest}>
    {children}
  </p>
);
