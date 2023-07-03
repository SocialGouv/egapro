import { formatZodErrors } from "@common/utils/debug";
import { useFormContext } from "react-hook-form";

import { ClientOnly } from "../ClientOnly";

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
