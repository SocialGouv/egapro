import Button from "@codegouvfr/react-dsfr/Button";
import { type Any } from "@common/utils/types";
import { ClientOnly } from "@components/utils/ClientOnly";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { type FieldValues, type FormState, useFormContext } from "react-hook-form";

interface Props {
  formState?: FormState<FieldValues>;
}

/**
 * Recursive traversal of the errors object or array to collect all the errors.
 */
const collectErrors = (issues: Any, path: string[] = []): Array<[string, string]> => {
  if (issues?.message) return [[path.join("."), issues.message]];

  if (Array.isArray(issues)) {
    return issues.flatMap((issue, index) => collectErrors(issue, [...path, String(index)]));
  }

  if (typeof issues === "object") {
    return Object.entries(issues).flatMap(([key, value]) => collectErrors(value, [...path, key]));
  }

  return [];
};

/*
 Counter intuitive behavior of RHF: 

 It doesn't derive isValid from errors (it's not like Object.keys(errors).length > 0).

 In fact :
 - isValid is computed when the useForm's mode is set to onChange. On each keystroke, the validation is made and isValid is updated.
 - errors for a field is only updated when the user has dirty the field or when trigger is called. So if the user has not dirty the field, the isValid will probably will be false with no error.
 */

export const ReactHookFormDebug = (props: Props) => {
  const { watch, formState, trigger } = useFormContext();

  // Can't use ...rest because nothing is returned since formState is a Proxy and must be destructured explicitly.
  const { errors, isValid, isDirty } = props.formState || formState;

  const presenterErrors = Object.fromEntries(collectErrors(errors));

  return (
    <ClientOnly>
      <fieldset>
        <legend>React Hook Form Debug</legend>
        <fieldset>
          <legend>Form Values</legend>
          <pre>{JSON.stringify(watch(), null, 2)}</pre>
        </fieldset>
        <fieldset>
          <legend>
            <DebugButton obj={errors} alwaysOn infoText="Form Errors" /> Form Errors
          </legend>
          <Button type="button" onClick={() => trigger()}>
            Manually trigger validation
          </Button>
          <pre>
            isValid: {JSON.stringify(isValid, null, 2)}
            <br />
            isDirty: {JSON.stringify(isDirty, null, 2)}
          </pre>
          {/* when mode is onChange, errors are only updated when the user has dirty the field or when the form is submitted. */}
          <pre>{JSON.stringify(presenterErrors, null, 2)}</pre>
          {/* isValid is only updated when the mode of useForm is set to onChange. */}
        </fieldset>
      </fieldset>
    </ClientOnly>
  );
};
