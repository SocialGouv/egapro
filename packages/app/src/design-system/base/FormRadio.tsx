import clsx from "clsx";
import type { PropsWithChildren, ReactNode } from "react";
import React, { Children } from "react";

import type { AuthorizedChildType } from "../utils/compatible-components";
import { compatibleComponents } from "../utils/compatible-components";

export type FormRadioGroupProps = PropsWithChildren<
  React.ReactHTMLElement<HTMLDivElement> & {
    isDisabled?: boolean;
    isError?: boolean;
    isValid?: boolean;
  }
>;

export const FormRadioGroup = ({ children, isError, isValid, isDisabled }: FormRadioGroupProps) => {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents(["FormRadioInput", "FormRadioLegend", "ValidationMessage"], arrayOfChildren);
  const legend = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormRadioLegend");
  const content = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormRadioInput");
  const validation = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "ValidationMessage");

  return (
    <div className="fr-form-group">
      <fieldset
        className={clsx("fr-fieldset", isError && "fr-fieldset--error", isValid && "fr-fieldset--valid")}
        disabled={isDisabled}
        role="group"
      >
        {legend}
        <div className="fr-fieldset__content">{content}</div>
        {validation.length > 0 && validation}
      </fieldset>
    </div>
  );
};

FormRadioGroup.Legend = function FormRadioLegend({ children, id }: { children: ReactNode; id: string }) {
  return (
    <legend className="fr-fieldset__legend fr-text--regular" id={id}>
      {children}
    </legend>
  );
};

FormRadioGroup.Input = function FormRadioInput({
  children,
  id,
  size,
}: {
  children: ReactNode;
  id: string;
  size?: "md" | "sm";
}) {
  const sizeClass = size ? size : "md";
  return (
    <div className={clsx("fr-radio-group", `fr-radio-group--${sizeClass}`)}>
      <input id={id} type="radio" />
      <label className="fr-label" htmlFor={id}>
        {children}
      </label>
    </div>
  );
};

FormRadioGroup.ValidationMessage = function ValidationMessage({
  children,
  isError,
  isValid,
}: {
  children: ReactNode;
  isError?: boolean;
  isValid?: boolean;
}) {
  return (
    <p
      id="radio-valid-desc-valid"
      className={clsx("fr-fieldset", isError && "fr-error-text", isValid && "fr-valid-text")}
    >
      {children}
    </p>
  );
};
