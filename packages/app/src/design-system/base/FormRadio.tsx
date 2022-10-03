import clsx from "clsx";
import type { PropsWithChildren, ReactNode } from "react";
import React, { Children } from "react";

import type { AuthorizedChildType } from "../utils/compatible-components";
import { compatibleComponents } from "../utils/compatible-components";
import { Box } from "./Box";
import type { MarginProps } from "design-system/utils/spacing";

export type FormRadioGroupProps = PropsWithChildren<
  Omit<MarginProps, "ml" | "mr" | "mx"> & {
    ariaLabelledby?: string;
    inline?: boolean;
    isDisabled?: boolean;
    isError?: boolean;
    isValid?: boolean;
    size?: "md" | "sm";
  }
>;

export const FormRadioGroup = ({
  children,
  isError,
  isValid,
  isDisabled,
  size = "md",
  inline,
  ariaLabelledby,
  ...rest
}: FormRadioGroupProps) => {
  const arrayOfChildren = Children.toArray(children);
  compatibleComponents("FormRadio", ["FormRadioInput", "FormRadioLegend", "ValidationMessage"], arrayOfChildren);
  const legend = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormRadioLegend");
  const content = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "FormRadioInput");
  const validation = arrayOfChildren.filter(child => (child as AuthorizedChildType).type.name === "ValidationMessage");
  return (
    <Box
      className={clsx("fr-form-group", size === "sm" && "fr-radio-group--sm", inline && "fr-fieldset--inline")}
      {...rest}
    >
      <fieldset
        className={clsx("fr-fieldset", isError && "fr-fieldset--error", isValid && "fr-fieldset--valid")}
        disabled={isDisabled}
        role="group"
        aria-labelledby={ariaLabelledby}
      >
        {legend}
        <div className="fr-fieldset__content">{content}</div>
        {validation.length > 0 && validation}
      </fieldset>
    </Box>
  );
};

FormRadioGroup.Legend = function FormRadioLegend({ children, id }: PropsWithChildren<{ id: string }>) {
  return (
    <legend className="fr-fieldset__legend fr-text--regular" id={id}>
      {children}
    </legend>
  );
};

FormRadioGroup.Input = function FormRadioInput({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div className="fr-radio-group">
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
  id,
}: PropsWithChildren<{
  id: string;
  isError?: boolean;
  isValid?: boolean;
}>) {
  return (
    <p id={id} className={clsx(isError && "fr-error-text", isValid && "fr-valid-text")}>
      {children}
    </p>
  );
};
