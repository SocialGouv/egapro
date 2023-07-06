"use client";

import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { useSelectedLayoutSegment } from "next/navigation";

export const RepEqBreadcrumb = () => {
  const segment = useSelectedLayoutSegment();

  return (
    <Breadcrumb
      homeLinkProps={{
        href: "/",
      }}
      segments={[
        ...(segment
          ? [
              {
                label: "Représentation équilibrée",
                linkProps: {
                  href: "/representation-equilibree",
                },
              },
            ]
          : []),
      ]}
      currentPageLabel={
        segment ? "Déclarer les écarts éventuels de représentation femmes‑hommes" : "Représentation équilibrée"
      }
    />
  );
};
