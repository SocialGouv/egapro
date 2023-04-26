import { isEmpty } from "@common/utils/object";
import { useRouter } from "next/router";
import { type PropsWithChildren } from "react";
import { type ZodType } from "zod";

import { Alert, AlertTitle } from "../design-system/base/Alert";

/**
 * Boundary component to check router query params against zod schema.
 * It not renders children as long as the query params are incorrect.
 */
export const ParamsChecker = ({ schema, children, ...delegated }: PropsWithChildren<unknown> & { schema: ZodType }) => {
  const router = useRouter();

  if (isEmpty(router.query)) return <p>En attente des paramètres...</p>;

  const checkQueryParams = schema.safeParse(router.query);
  if (!checkQueryParams.success) {
    const zodErrors = checkQueryParams.error.flatten();
    const errors = Object.keys(zodErrors.fieldErrors).map(key =>
      !Array.isArray(zodErrors.fieldErrors[key]) ? "" : (zodErrors.fieldErrors[key] as string[]).join(", "),
    );

    return (
      <Alert type="error" size="sm" mb="4w">
        <AlertTitle>Erreur</AlertTitle>
        <ul>
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </Alert>
    );
  }

  return <div {...delegated}>{children}</div>;
};
