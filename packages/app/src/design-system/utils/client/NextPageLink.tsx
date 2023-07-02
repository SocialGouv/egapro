"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Uses `useSearchParams()` internally, must be Suspense-d in server component.
 */
export const NextPageLink = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const nextPage = String((parseInt(searchParams?.get("page") ?? "0") || 0) + 1);
  const cleanSearchParams = new URLSearchParams([...(searchParams?.entries() ?? [])]);
  cleanSearchParams.set("page", nextPage);
  const url = `${pathname}?${cleanSearchParams.toString()}`;

  useEffect(() => {
    router.prefetch(url);
  }, [router, url]);

  return (
    <Button
      onClick={e => {
        e.preventDefault();
        router.replace(`${url}#footer`, { forceOptimisticNavigation: true });
        // TODO remove
        // temp hack with #footer because next auto scroll to top with router.replace or Link
        // https://github.com/vercel/next.js/issues/50398
        // https://github.com/vercel/next.js/issues/50105
        router.replace(url);
      }}
      priority="secondary"
    >
      Voir les résultats suivants
    </Button>
  );
};
