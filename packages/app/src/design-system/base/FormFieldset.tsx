import { type PropsWithoutChildren } from "@common/utils/types";
import { clsx } from "clsx";
import { type PropsWithChildren, type ReactNode } from "react";
import { useId } from "react";

import { Box } from "./Box";

export type FormFieldsetProps = JSX.IntrinsicElements["fieldset"] & {
  elements: ReactNode[];
  error?: ReactNode;
  hint?: ReactNode;
  legend: ReactNode;
  valid?: ReactNode;
};
export const FormFieldset = ({
  hint,
  legend,
  elements,
  error,
  valid,
  ...rest
}: PropsWithoutChildren<FormFieldsetProps>) => {
  const id = useId();
  const hasAssert = !!error || !!valid;
  const assertMessageId = `fr-fieldset-${id}-${error ? "error" : "valid"}`;

  return (
    <fieldset
      {...rest}
      role="group"
      className={clsx("fr-fieldset", error ? "fr-fieldset--error" : valid ? "fr-fieldset--valid" : "")}
      aria-labelledby={clsx(`fr-fieldset-${id}-legend`, hasAssert && assertMessageId)}
    >
      <legend className={clsx("fr-fieldset__legend", "fr-fieldset__legend--regular")} id={`fr-fieldset-${id}-legend`}>
        {legend}
        {hint && <span className="fr-hint-text">{hint}</span>}
      </legend>
      {elements.map((element, index) => (
        <Box key={`fieldset__element-${index}`} className="fr-fieldset__element">
          {element}
        </Box>
      ))}
      {hasAssert && (
        <FormFieldsetMessageGroup id={assertMessageId} isValid={!!valid}>
          {error ?? valid}
        </FormFieldsetMessageGroup>
      )}
    </fieldset>
  );
};

interface FormFieldsetMessageGroupProps {
  id: string;
  isValid: boolean;
}
const FormFieldsetMessageGroup = ({ id, isValid, children }: PropsWithChildren<FormFieldsetMessageGroupProps>) => (
  <div className="fr-messages-group" id={id} aria-live="assertive">
    <p className={clsx("fr-message", isValid ? "fr-message--valid" : "fr-message--error")}>{children}</p>
  </div>
);
