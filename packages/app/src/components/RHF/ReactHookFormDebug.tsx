import { formatZodErrors } from "@common/utils/debug";
import { ClientOnly } from "@components/utils/ClientOnly";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { type FieldValues, type FormState, useFormContext } from "react-hook-form";

interface Props {
  formState?: FormState<FieldValues>;
}
export const ReactHookFormDebug = (props: Props) => {
  const { watch, formState } = useFormContext();

  const { errors, ...rest } = props.formState || formState;

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
          <pre>{formatZodErrors(errors)}</pre>
        </fieldset>
        <fieldset>
          <legend>Form State</legend>
          <pre>{JSON.stringify(rest, null, 2)}</pre>
        </fieldset>
      </fieldset>
    </ClientOnly>
  );
};
