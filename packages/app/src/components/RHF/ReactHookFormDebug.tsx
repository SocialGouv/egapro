import { formatZodErrors } from "@common/utils/debug";
import { ClientOnly } from "@components/utils/ClientOnly";
import { useFormContext } from "react-hook-form";

export const ReactHookFormDebug = () => {
  const {
    watch,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <ClientOnly>
        <pre>{JSON.stringify(watch(), null, 2)}</pre>
        <pre>{formatZodErrors(errors)}</pre>
      </ClientOnly>
    </>
  );
};
