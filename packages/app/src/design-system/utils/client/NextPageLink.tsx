"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Uses `useSearchParams()` internaly, must be Suspense-d in server component.
 */
export const NextPageLink = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const nextPage = String((parseInt(searchParams?.get("page") ?? "0") || 0) + 1);
  const cleanSearchParams = new URLSearchParams(searchParams ?? {});
  cleanSearchParams.set("page", nextPage);

  return (
    <Button linkProps={{ href: `${pathname}?${cleanSearchParams.toString()}` }} priority="secondary">
      Voir les résultats suivants
    </Button>
  );
};
