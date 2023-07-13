import { formatZodErrors } from "@common/utils/debug";
import { ClientOnly } from "@components/utils/ClientOnly";
import { useFormContext } from "react-hook-form";

export const ReactHookFormDebug = () => {
  const {
    watch,
    formState: { errors, ...rest },
  } = useFormContext();

  return (
    <ClientOnly>
      <fieldset>
        <legend>React Hook Form Debug</legend>
        <fieldset>
          <legend>Form Values</legend>
          <pre>{JSON.stringify(watch(), null, 2)}</pre>
        </fieldset>
        <fieldset>
          <legend>Form Errors</legend>
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
