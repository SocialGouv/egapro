import { formatZodErrors } from "@common/utils/debug";
import { useFormContext } from "react-hook-form";

export const ReactHookFormDebug = () => {
  const {
    watch,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <pre>{JSON.stringify(watch(), null, 2)}</pre>
      <pre>{formatZodErrors(errors)}</pre>
    </>
  );
};
