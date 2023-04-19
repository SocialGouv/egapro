"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { usePathname, useSearchParams } from "next/navigation";

export const NextPageLink = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const nextPage = String((parseInt(searchParams?.get("page") ?? "0") || 0) + 1);
  const cleanSearchParams = new URLSearchParams(searchParams ?? {});
  cleanSearchParams.set("page", nextPage);

  return (
    <div className="fr-mt-3w">
      <Button linkProps={{ href: `${pathname}?${cleanSearchParams.toString()}` }} priority="secondary">
        Voir les résultats suivants
      </Button>
    </div>
  );
};
