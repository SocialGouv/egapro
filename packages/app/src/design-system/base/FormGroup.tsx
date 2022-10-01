import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { Children } from "react";
import type { AuthorizedChildType } from "../utils/compatible-components";
import { compatibleComponents } from "../utils/compatible-components";

export type FormGroupProps = PropsWithChildren<{
  isError?: boolean;
  isValid?: boolean;
}>;

export const FormGroup = ({ isValid, isError, children }: FormGroupProps) => {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("FormGroup", ["FormInput", "FormSelect", "FormGroupLabel", "FormGroupMessage"], arrayOfChildren);
  const label = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormGroupLabel");
  const input = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormInput");
  const select = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormSelect");

  const message = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormGroupMessage");
  return (
    <div className={clsx("fr-input-group", isValid && "fr-input-group--valid", isError && "fr-input-group--error")}>
      {label}
      {input}
      {select}
      {message}
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
